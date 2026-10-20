import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { TOPICS } from '../config';
import { MqttService } from '../services/mqttService';
import { defaultPreferences, loadPreferences, savePreferences } from '../services/storageService';
import { themes } from '../themes/colors';
import type { Palette } from '../themes/colors';
import type { ConnectionState, LampState, MessageEntry, Preferences, Reading, ThemeName } from '../types/mqtt';
import { parseTelemetry, prependMessage, validateBrokerUrl } from '../utils/protocol';

interface IoTState {
  loaded: boolean;
  preferences: Preferences;
  palette: Palette;
  status: ConnectionState;
  detail: string;
  notice: string;
  temperature: Reading<number> | null;
  humidity: Reading<number> | null;
  lamp: Reading<LampState> | null;
  messages: MessageEntry[];
  pending: LampState | null;
  connect: (url?: string) => void;
  disconnect: () => void;
  saveBroker: (url: string) => Promise<boolean>;
  changeTheme: (theme: ThemeName) => void;
  command: (action: LampState) => Promise<void>;
}
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
  const [notice, setNotice] = useState('');
  const [temperature, setTemperature] = useState<Reading<number> | null>(null);
  const [humidity, setHumidity] = useState<Reading<number> | null>(null);
  const [lamp, setLamp] = useState<Reading<LampState> | null>(null);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [pending, setPending] = useState<LampState | null>(null);
  const pendingRef = useRef<LampState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRef = useRef<MqttService | null>(null);
  const sequenceRef = useRef(0);
  const aliveRef = useRef(false);

  function clearPending() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
    setPending(null);
  }
  function record(topic: string, payload: string, direction: MessageEntry['direction'], valid: boolean) {
    const entry: MessageEntry = {
      id: String(++sequenceRef.current), topic, payload: payload.slice(0, 2048),
      timestamp: Date.now(), direction, valid,
    };
    setMessages(previous => prependMessage(previous, entry));
  }

  useEffect(() => {
    aliveRef.current = true;
    let active = true;
    const service = new MqttService({
      onStatus: (nextStatus, nextDetail) => {
        if (!active) return;
        setStatus(nextStatus);
        setDetail(nextDetail ?? '');
        if (nextStatus !== 'conectado') clearPending();
      },
      onMessage: (topic, payload) => {
        if (!active) return;
        const parsed = parseTelemetry(topic, payload);
        record(topic, payload, 'recebida', parsed !== null);
        if (!parsed) {
          setNotice('Mensagem inválida ignorada. Consulte o histórico.');
          return;
        }
        const updatedAt = Date.now();
        if (parsed.kind === 'temperature') setTemperature({ value: parsed.value, updatedAt });
        if (parsed.kind === 'humidity') setHumidity({ value: parsed.value, updatedAt });
        if (parsed.kind === 'lamp') {
          setLamp({ value: parsed.value, updatedAt });
          if (pendingRef.current === parsed.value) {
            clearPending();
            setNotice('Estado da lâmpada confirmado pelo dispositivo.');
          }
        }
      },
    });
    serviceRef.current = service;
    loadPreferences().then(value => {
      if (!active) return;
      preferencesRef.current = value;
      setPreferences(value);
    }).catch(() => {
      if (active) setNotice('Não foi possível recuperar as preferências. Usando os valores padrão.');
    }).finally(() => { if (active) setLoaded(true); });
    return () => {
      active = false;
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      service.disconnect(false);
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, []);

  function connect(url = preferencesRef.current.brokerUrl) {
    try {
      validateBrokerUrl(url);
      setTemperature(null); setHumidity(null); setLamp(null);
      setNotice('');
      serviceRef.current?.connect(url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'URL inválida.');
    }
  }
  function disconnect() {
    clearPending();
    serviceRef.current?.disconnect();
    setNotice('Desconectado. As leituras exibidas são os últimos valores recebidos.');
  }
  async function persist(value: Preferences): Promise<boolean> {
    try { await savePreferences(value); return true; }
    catch { if (aliveRef.current) setNotice('Falha ao salvar preferências no armazenamento local.'); return false; }
  }
  async function saveBroker(input: string): Promise<boolean> {
    try {
      const url = validateBrokerUrl(input);
      const changed = url !== preferencesRef.current.brokerUrl;
      const previous = preferencesRef.current;
      const next = { ...previous, brokerUrl: url };
      preferencesRef.current = next; setPreferences(next);
      if (!await persist(next)) {
        if (preferencesRef.current === next) { preferencesRef.current = previous; setPreferences(previous); }
        return false;
      }
      if (changed) {
        serviceRef.current?.disconnect();
        setTemperature(null); setHumidity(null); setLamp(null);
      }
      setNotice('Endereço salvo. Toque em Conectar para usar o broker.');
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'URL inválida.');
      return false;
    }
  }
  function changeTheme(theme: ThemeName) {
    const next = { ...preferencesRef.current, theme };
    preferencesRef.current = next; setPreferences(next);
    void persist(next);
  }
  async function command(action: LampState) {
    if (pendingRef.current) return;
    if (status !== 'conectado' || !serviceRef.current) {
      setNotice('Conecte ao broker antes de enviar comandos.');
      return;
    }
    pendingRef.current = action; setPending(action);
    setNotice('Enviando comando. Aguardando confirmação do dispositivo…');
    timerRef.current = setTimeout(() => {
      if (!aliveRef.current) return;
      clearPending();
      setNotice('Sem confirmação em 8 segundos. Verifique se o simulador está ligado. O estado não foi alterado.');
    }, 8000);
    try {
      await serviceRef.current.publishLamp(action);
      if (aliveRef.current) record(TOPICS.command, JSON.stringify({ action }), 'enviada', true);
    } catch (error) {
      if (!aliveRef.current) return;
      clearPending();
      setNotice(error instanceof Error ? error.message : 'Falha no envio.');
    }
  }

  return <IoTContext.Provider value={{
    loaded, preferences, palette: themes[preferences.theme], status, detail, notice,
    temperature, humidity, lamp, messages, pending, connect, disconnect, saveBroker, changeTheme, command,
  }}>{children}</IoTContext.Provider>;
}
