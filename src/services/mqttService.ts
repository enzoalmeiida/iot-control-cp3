import mqtt from 'mqtt/dist/mqtt.esm';
import type { MqttClient } from 'mqtt';
import { SUBSCRIPTIONS, TOPICS } from '../config';
import type { ConnectionState, LampState } from '../types/mqtt';
import { validateBrokerUrl } from '../utils/protocol';

interface Callbacks {
  onStatus: (status: ConnectionState, detail?: string) => void;
  onMessage: (topic: string, payload: string) => void;
}
export class MqttService {
  private client: MqttClient | null = null;
  private generation = 0;
  private ready = false;
  constructor(private callbacks: Callbacks) {}

  connect(input: string): void {
    const url = validateBrokerUrl(input);
    this.disconnect(false);
    const generation = ++this.generation;
    const current = () => generation === this.generation;
    this.callbacks.onStatus('conectando');
    try {
      const client = mqtt.connect(url, {
        clientId: 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
        keepalive: 30,
        resubscribe: false,
        queueQoSZero: false,
        timerVariant: 'native',
      });
      this.client = client;
      client.on('connect', () => {
        if (!current()) return;
        this.ready = false;
        client.subscribe(SUBSCRIPTIONS, { qos: 1 }, (error, grants) => {
          if (!current()) return;
          if (error || !grants || grants.some(grant => grant.qos === 128)) {
            this.callbacks.onStatus('erro', 'Não foi possível assinar os tópicos. Toque em Reconectar.');
            return;
          }
          this.ready = true;
          this.callbacks.onStatus('conectado');
        });
      });
      client.on('message', (topic, payload) => {
        if (current()) this.callbacks.onMessage(topic, payload.toString());
      });
      client.on('reconnect', () => {
        if (!current()) return;
        this.ready = false;
        this.callbacks.onStatus('conectando', 'Tentando reconectar ao broker…');
      });
      client.on('close', () => {
        if (!current()) return;
        this.ready = false;
        this.callbacks.onStatus('desconectado', 'Conexão interrompida. Uma nova tentativa ocorrerá automaticamente.');
      });
      client.on('error', (error: Error) => {
        if (!current()) return;
        this.ready = false;
        this.callbacks.onStatus('erro', 'Falha MQTT: ' + error.message);
      });
    } catch (error) {
      if (current()) this.callbacks.onStatus('erro', error instanceof Error ? error.message : 'Falha de conexão.');
    }
  }

  publishLamp(action: LampState): Promise<void> {
    const client = this.client;
    if (!client?.connected || !this.ready) {
      return Promise.reject(new Error('Conecte ao broker antes de enviar comandos.'));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Tempo esgotado ao enviar o comando.')), 4000);
      // QoS 0 com fila desativada evita guardar comandos para uma reconexão futura.
      client.publish(TOPICS.command, JSON.stringify({ action }), { qos: 0, retain: false }, error => {
        clearTimeout(timer);
        if (error) reject(error); else resolve();
      });
    });
  }

  disconnect(notify = true): void {
    ++this.generation;
    this.ready = false;
    const client = this.client;
    this.client = null;
    if (client) {
      if (client.connected) client.unsubscribe(SUBSCRIPTIONS);
      client.end(true);
      client.removeAllListeners();
      // Uma falha tardia do socket encerrado não deve propagar para a interface.
      client.on('error', () => undefined);
    }
    if (notify) this.callbacks.onStatus('desconectado');
  }
}
