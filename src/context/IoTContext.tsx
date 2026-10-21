import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { TOPICS } from '../config';
import { createMqttService } from '../services/mqttClient';
import type { MqttService } from '../services/mqttService';
import { defaultPreferences, loadPreferences, savePreferences } from '../services/storageService';
import { themes } from '../themes/colors';
import type { Palette } from '../themes/colors';
import type { ConnectionState, LampState, MessageEntry, Notice, NoticeTone, Preferences, Reading, SessionStats, ThemeName } from '../types/mqtt';
import { parseTelemetry, prependMessage, validateBrokerUrl } from '../utils/protocol';
import { appendSample, initialStats } from '../utils/telemetry';

interface IoTState {
  loaded: boolean; preferences: Preferences; palette: Palette;
  status: ConnectionState; detail: string; retrying: boolean; activeBroker: string | null;
  notice: Notice | null; temperature: Reading<number> | null; humidity: Reading<number> | null;
  lamp: Reading<LampState> | null; messages: MessageEntry[]; pending: LampState | null;
  temperatureSamples: Reading<number>[]; humiditySamples: Reading<number>[]; stats: SessionStats;
  connectedAt: number | null; lastMessageAt: number | null;
  connect: (url?: string) => void; disconnect: () => void;
  saveBroker: (url: string) => Promise<boolean>; changeTheme: (theme: ThemeName) => void;
  command: (action: LampState) => Promise<void>; dismissNotice: () => void;
}
interface PendingCommand { action: LampState; epoch: number; timer: ReturnType<typeof setTimeout> }
const IoTContext = createContext<IoTState | null>(null);
export function useIoT(): IoTState {
  const value = useContext(IoTContext);
  if (!value) throw new Error('useIoT requer IoTProvider.');
  return value;
}
export function IoTProvider({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const preferencesRef = useRef(defaultPreferences);
  const [status, setStatus] = useState<ConnectionState>('desconectado');
  const [detail, setDetail] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [activeBroker, setActiveBroker] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [temperature, setTemperature] = useState<Reading<number> | null>(null);
  const [humidity, setHumidity] = useState<Reading<number> | null>(null);
  const [lamp, setLamp] = useState<Reading<LampState> | null>(null);
  const [temperatureSamples, setTemperatureSamples] = useState<Reading<number>[]>([]);
  const [humiditySamples, setHumiditySamples] = useState<Reading<number>[]>([]);
  const [stats, setStats] = useState<SessionStats>(initialStats);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [pending, setPending] = useState<LampState | null>(null);
  const pendingRef = useRef<PendingCommand | null>(null);
  const serviceRef = useRef<MqttService | null>(null);
  const sequenceRef = useRef(0);
  const epochRef = useRef(0);
  const desiredRef = useRef(false);
  const aliveRef = useRef(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  function dismissNotice() {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = null; setNotice(null);
  }
  function notify(text: string, tone: NoticeTone = 'info', duration = 6500) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, tone });
    noticeTimer.current = duration ? setTimeout(() => {
      noticeTimer.current = null;
      if (aliveRef.current) setNotice(null);
    }, duration) : null;
  }
  function clearPending() {
    if (pendingRef.current) clearTimeout(pendingRef.current.timer);
    pendingRef.current = null; setPending(null);
  }
  function resetReadings() {
    setTemperature(null); setHumidity(null); setLamp(null);
    setTemperatureSamples([]); setHumiditySamples([]); setLastMessageAt(null);
  }
  function record(topic: string, payload: string, direction: MessageEntry['direction'], valid: boolean, retained = false) {
    const entry: MessageEntry = {
      id: String(++sequenceRef.current), topic, payload: payload.slice(0, 2048),
      timestamp: Date.now(), direction, valid, retained,
    };
    setMessages(previous => prependMessage(previous, entry));
    setStats(previous => ({
      ...previous,
      received: previous.received + (direction === 'recebida' ? 1 : 0),
      sent: previous.sent + (direction === 'enviada' ? 1 : 0),
      invalid: previous.invalid + (valid ? 0 : 1),
    }));
  }

  useEffect(() => {
    aliveRef.current = true;
    let active = true;
    const service = createMqttService({
      onStatus: (nextStatus, nextDetail, nextRetrying) => {
        if (!active) return;
        setStatus(nextStatus); setDetail(nextDetail ?? ''); setRetrying(nextRetrying ?? false);
        if (nextStatus === 'conectado') setConnectedAt(Date.now());
        else {
          setConnectedAt(null);
          if (pendingRef.current) {
            clearPending();
            notify('A conexão foi interrompida. O comando ficou sem confirmação.', 'warning');
          }
        }
      },
      onReconnect: () => { if (active) setStats(previous => ({ ...previous, reconnects: previous.reconnects + 1 })); },
      onMessage: (topic, payload, retained) => {
        if (!active) return;
        const parsed = parseTelemetry(topic, payload);
        record(topic, payload, 'recebida', parsed !== null, retained);
        if (!parsed) {
          notify('Mensagem inválida ignorada. Consulte o histórico.', 'warning');
          return;
        }
        const updatedAt = Date.now();
        setLastMessageAt(updatedAt);
        if (parsed.kind === 'temperature') {
          const reading = { value: parsed.value, updatedAt };
          setTemperature(reading); setTemperatureSamples(previous => appendSample(previous, reading));
        }
        if (parsed.kind === 'humidity') {
          const reading = { value: parsed.value, updatedAt };
          setHumidity(reading); setHumiditySamples(previous => appendSample(previous, reading));
        }
        if (parsed.kind === 'lamp') {
          setLamp({ value: parsed.value, updatedAt });
          if (!retained && pendingRef.current?.action === parsed.value) {
            clearPending(); notify('Estado da lâmpada confirmado pelo dispositivo.', 'success');
          }
        }
      },
    });
    serviceRef.current = service;
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active' && desiredRef.current && !service.connected) {
        ++epochRef.current; clearPending(); service.connect(preferencesRef.current.brokerUrl);
      }
    });
    loadPreferences().then(value => {
      if (!active) return;
      preferencesRef.current = value; setPreferences(value);
    }).catch(() => {
      if (active) notify('Não foi possível recuperar as preferências. Usando os valores padrão.', 'warning');
    }).finally(() => { if (active) setLoaded(true); });
    return () => {
      active = false; aliveRef.current = false; ++epochRef.current;
      appState.remove();
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      if (pendingRef.current) clearTimeout(pendingRef.current.timer);
      service.disconnect(false);
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, []);

  function connect(input = preferencesRef.current.brokerUrl) {
    try {
      const url = validateBrokerUrl(input);
      ++epochRef.current; clearPending(); resetReadings(); dismissNotice();
      desiredRef.current = true; setActiveBroker(url);
      serviceRef.current?.connect(url);
    } catch (error) { notify(error instanceof Error ? error.message : 'URL inválida.', 'error'); }
  }
  function disconnect() {
    desiredRef.current = false; ++epochRef.current; clearPending();
    serviceRef.current?.disconnect();
    notify('Conexão encerrada. Você pode reconectar quando quiser.', 'info');
  }
  async function persist(value: Preferences): Promise<boolean> {
    try { await savePreferences(value); return true; }
    catch { if (aliveRef.current) notify('Não foi possível salvar as preferências. Tente novamente.', 'error', 0); return false; }
  }
  async function saveBroker(input: string): Promise<boolean> {
    try {
      const url = validateBrokerUrl(input);
      const previous = preferencesRef.current;
      const changed = url !== previous.brokerUrl;
      const next = { ...previous, brokerUrl: url };
      preferencesRef.current = next; setPreferences(next);
      if (!await persist(next)) {
        if (preferencesRef.current === next) { preferencesRef.current = previous; setPreferences(previous); }
        return false;
      }
      if (changed) {
        desiredRef.current = false; ++epochRef.current; clearPending();
        serviceRef.current?.disconnect(); resetReadings(); setActiveBroker(null);
      }
      notify('Endereço salvo neste dispositivo.', 'success');
      return true;
    } catch (error) { notify(error instanceof Error ? error.message : 'URL inválida.', 'error'); return false; }
  }
  function changeTheme(theme: ThemeName) {
    const next = { ...preferencesRef.current, theme };
    preferencesRef.current = next; setPreferences(next); void persist(next);
  }
  async function command(action: LampState) {
    if (pendingRef.current) return;
    if (status !== 'conectado' || !serviceRef.current?.connected) {
      notify('Conecte ao broker antes de enviar comandos.', 'warning'); return;
    }
    const epoch = epochRef.current;
    const request: PendingCommand = {
      action, epoch,
      timer: setTimeout(() => {
        if (!aliveRef.current || pendingRef.current !== request) return;
        clearPending();
        notify('Sem confirmação em 8 segundos. Verifique o simulador. O último estado recebido foi mantido.', 'warning', 0);
      }, 8000),
    };
    pendingRef.current = request; setPending(action);
    dismissNotice();
    try {
      await serviceRef.current.publishLamp(action);
      if (aliveRef.current && epoch === epochRef.current) record(TOPICS.command, JSON.stringify({ action }), 'enviada', true);
    } catch (error) {
      if (!aliveRef.current || epoch !== epochRef.current || pendingRef.current !== request) return;
      clearPending(); notify(error instanceof Error ? error.message : 'Falha no envio.', 'error');
    }
  }
  return <IoTContext.Provider value={{
    loaded, preferences, palette: themes[preferences.theme], status, detail, retrying, activeBroker, notice,
    temperature, humidity, lamp, messages, pending, temperatureSamples, humiditySamples, stats, connectedAt,
    lastMessageAt, connect, disconnect, saveBroker, changeTheme, command, dismissNotice,
  }}>{children}</IoTContext.Provider>;
}
