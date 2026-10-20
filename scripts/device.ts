import mqtt from 'mqtt';
import { createTopics, TOPIC_PREFIX } from '../src/config';
import { validateBrokerUrl } from '../src/utils/protocol';

export function startDevice(url: string, prefix = TOPIC_PREFIX) {
  const topics = createTopics(prefix);
  const client = mqtt.connect(validateBrokerUrl(url), {
    clientId: 'device-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
    clean: true, reconnectPeriod: 3000, connectTimeout: 10000, queueQoSZero: false,
  });
  let lamp: 'ON' | 'OFF' = 'OFF';
  let interval: ReturnType<typeof setInterval> | undefined;
  let tick = 0;
  const publish = (topic: string, payload: object) => {
    if (!client.connected) return;
    client.publish(topic, JSON.stringify(payload), { qos: 0, retain: false }, error => {
      if (error) console.error('[simulador] Falha ao publicar:', error.message);
    });
  };
  function telemetry() {
    publish(topics.temperature, { value: Number((24 + Math.sin(tick / 4) * 2).toFixed(1)) });
    publish(topics.humidity, { value: Number((58 + Math.cos(tick / 4) * 7).toFixed(1)) });
    publish(topics.lamp, { state: lamp });
    ++tick;
  }
  function clearTimer() { if (interval) clearInterval(interval); interval = undefined; }
  const ready = new Promise<void>((resolve, reject) => {
    client.on('connect', () => {
      clearTimer();
      client.subscribe(topics.command, { qos: 1 }, (error, grants) => {
        if (error || grants?.some(grant => grant.qos === 128)) {
          reject(error ?? new Error('Inscrição de comandos recusada.'));
          return;
        }
        console.log('[simulador] Conectado. Inscrito em', topics.command);
        telemetry();
        interval = setInterval(telemetry, 2000);
        resolve();
      });
    });
    client.on('error', error => {
      console.error('[simulador]', error.message);
      reject(error);
    });
  });
  client.on('close', clearTimer);
  client.on('message', (topic, bytes, packet) => {
    if (topic !== topics.command || packet.retain || bytes.length > 2048) return;
    try {
      const data: unknown = JSON.parse(bytes.toString());
      if (typeof data !== 'object' || data === null || !('action' in data) || (data.action !== 'ON' && data.action !== 'OFF')) {
        console.warn('[simulador] Comando inválido ignorado.'); return;
      }
      lamp = data.action;
      console.log('[simulador] Comando recebido:', lamp);
      publish(topics.lamp, { state: lamp });
    } catch { console.warn('[simulador] JSON inválido ignorado.'); }
  });
  function stop() { clearTimer(); client.end(true); }
  return { client, ready, stop, topics };
}
