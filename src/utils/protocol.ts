import { TOPICS } from '../config';
import type { MessageEntry, Telemetry } from '../types/mqtt';

export function validateBrokerUrl(input: string): string {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error('Informe uma URL completa, como wss://test.mosquitto.org:8081/mqtt.'); }
  if (!['ws:', 'wss:'].includes(url.protocol) || !url.hostname) {
    throw new Error('Use uma URL WebSocket: ws:// ou wss://.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Não inclua credenciais, tokens ou fragmentos na URL.');
  }
  if (url.port === '1883' || url.port === '8883') {
    throw new Error('1883 e 8883 são portas MQTT TCP. Informe a porta WebSocket do broker.');
  }
  return url.toString();
}

export function parseTelemetry(topic: string, payload: string): Telemetry | null {
  if (payload.length > 2048) return null;
  let data: unknown;
  try { data = JSON.parse(payload); } catch { return null; }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  if (topic === TOPICS.lamp && 'state' in data && (data.state === 'ON' || data.state === 'OFF')) {
    return { kind: 'lamp', value: data.state };
  }
  if (!('value' in data) || typeof data.value !== 'number' || !Number.isFinite(data.value)) return null;
  if (topic === TOPICS.temperature && data.value >= -50 && data.value <= 150) {
    return { kind: 'temperature', value: data.value };
  }
  if (topic === TOPICS.humidity && data.value >= 0 && data.value <= 100) {
    return { kind: 'humidity', value: data.value };
  }
  return null;
}

export function prependMessage(history: MessageEntry[], entry: MessageEntry): MessageEntry[] {
  return [entry, ...history].slice(0, 10);
}

export function formatTime(timestamp?: number): string {
  return timestamp === undefined ? 'Aguardando primeira leitura' : new Date(timestamp).toLocaleTimeString('pt-BR');
}
