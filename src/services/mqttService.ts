import { SUBSCRIPTIONS, TOPICS } from '../config';
import type { ConnectionState, LampState } from '../types/mqtt';
import { validateBrokerUrl } from '../utils/protocol';

export interface TransportHandlers {
  connect: () => void;
  message: (topic: string, payload: string, retained: boolean) => void;
  close: () => void;
  reconnect: () => void;
  error: (error: Error) => void;
}
export interface MqttTransport {
  readonly connected: boolean;
  subscribe: (topics: string[], done: (error?: Error) => void) => void;
  publish: (topic: string, payload: string, done: (error?: Error) => void) => void;
  dispose: () => void;
}
export type TransportFactory = (url: string, handlers: TransportHandlers) => MqttTransport;
export interface MqttCallbacks {
  onStatus: (status: ConnectionState, detail?: string, retrying?: boolean) => void;
  onMessage: (topic: string, payload: string, retained: boolean) => void;
  onReconnect?: () => void;
}
export class MqttService {
  private transport: MqttTransport | null = null;
  private generation = 0;
  private ready = false;
  private subscriptionTimer: ReturnType<typeof setTimeout> | null = null;
  private sends = new Set<(error?: Error) => void>();
  constructor(private callbacks: MqttCallbacks, private factory: TransportFactory) {}

  get connected(): boolean { return this.ready && !!this.transport?.connected; }
  private clearSubscriptionTimer() {
    if (this.subscriptionTimer) clearTimeout(this.subscriptionTimer);
    this.subscriptionTimer = null;
  }
  private rejectSends(message: string) {
    for (const finish of [...this.sends]) finish(new Error(message));
  }
  connect(input: string): void {
    const url = validateBrokerUrl(input);
    this.disconnect(false);
    const generation = ++this.generation;
    const current = () => generation === this.generation;
    let lastError = '';
    this.callbacks.onStatus('conectando');
    try {
      this.transport = this.factory(url, {
        connect: () => {
          if (!current()) return;
          lastError = '';
          this.ready = false;
          this.clearSubscriptionTimer();
          const failSubscription = (message: string) => {
            if (!current()) return;
            this.disconnect(false);
            this.callbacks.onStatus('erro', message + ' Toque em Reconectar.');
          };
          this.subscriptionTimer = setTimeout(() => failSubscription('O broker não confirmou a inscrição nos tópicos.'), 6000);
          this.transport?.subscribe(SUBSCRIPTIONS, error => {
            if (!current()) return;
            this.clearSubscriptionTimer();
            if (error) { failSubscription(error.message); return; }
            this.ready = true;
            this.callbacks.onStatus('conectado');
          });
        },
        message: (topic, payload, retained) => {
          if (current()) this.callbacks.onMessage(topic, payload, retained);
        },
        reconnect: () => {
          if (!current()) return;
          this.ready = false;
          this.clearSubscriptionTimer();
          lastError = '';
          this.callbacks.onReconnect?.();
          this.callbacks.onStatus('conectando', 'Reconectando ao ambiente…', true);
        },
        close: () => {
          if (!current()) return;
          this.ready = false;
          this.clearSubscriptionTimer();
          this.rejectSends('A conexão foi interrompida antes de concluir o envio.');
          this.callbacks.onStatus(lastError ? 'erro' : 'desconectado',
            lastError || 'Conexão interrompida. Tentaremos novamente em 3 segundos.', true);
        },
        error: error => {
          if (!current()) return;
          this.ready = false;
          lastError = 'Não foi possível comunicar com o broker. ' + error.message;
          this.callbacks.onStatus('erro', lastError, true);
        },
      });
    } catch (error) {
      if (current()) {
        this.disconnect(false);
        this.callbacks.onStatus('erro', error instanceof Error ? error.message : 'Falha de conexão.');
      }
    }
  }
  publishLamp(action: LampState): Promise<void> {
    const transport = this.transport;
    if (!transport?.connected || !this.ready) return Promise.reject(new Error('Conecte ao broker antes de enviar comandos.'));
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = (error?: Error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        this.sends.delete(finish);
        if (error) reject(error); else resolve();
      };
      const timer = setTimeout(() => finish(new Error('Tempo esgotado ao enviar o comando.')), 4000);
      this.sends.add(finish);
      try { transport.publish(TOPICS.command, JSON.stringify({ action }), finish); }
      catch (error) { finish(error instanceof Error ? error : new Error('Falha no envio.')); }
    });
  }
  disconnect(notify = true): void {
    ++this.generation;
    this.ready = false;
    this.clearSubscriptionTimer();
    this.rejectSends('Envio cancelado porque a conexão foi encerrada.');
    const transport = this.transport;
    this.transport = null;
    transport?.dispose();
    if (notify) this.callbacks.onStatus('desconectado');
  }
}
