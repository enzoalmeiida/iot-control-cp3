import mqtt from 'mqtt/dist/mqtt.esm';
import { SUBSCRIPTIONS } from '../config';
import { MqttService } from './mqttService';
import type { MqttCallbacks, TransportFactory } from './mqttService';

export const createTransport: TransportFactory = (url, handlers) => {
  const client = mqtt.connect(url, {
    clientId: 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
    protocolVersion: 4, clean: true, reconnectPeriod: 3000, connectTimeout: 10000,
    keepalive: 30, resubscribe: false, queueQoSZero: false, timerVariant: 'native',
  });
  client.on('connect', handlers.connect);
  client.on('message', (topic, bytes, packet) => handlers.message(topic, bytes.toString(), packet.retain));
  client.on('close', handlers.close);
  client.on('reconnect', handlers.reconnect);
  client.on('error', handlers.error);
  return {
    get connected() { return client.connected; },
    subscribe: (topics, done) => client.subscribe(topics, { qos: 1 }, (error, grants) => {
      if (error) done(error);
      else if (!grants || grants.some(grant => grant.qos === 128)) done(new Error('A assinatura de um tópico foi recusada.'));
      else done();
    }),
    publish: (topic, payload, done) => client.publish(topic, payload, { qos: 0, retain: false }, error => done(error ?? undefined)),
    dispose: () => {
      if (client.connected) client.unsubscribe(SUBSCRIPTIONS);
      client.end(true);
      client.removeAllListeners();
      client.on('error', () => undefined);
    },
  };
};
export function createMqttService(callbacks: MqttCallbacks): MqttService {
  return new MqttService(callbacks, createTransport);
}
