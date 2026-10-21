import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MqttService } from '../src/services/mqttService';
import type { MqttTransport, TransportHandlers } from '../src/services/mqttService';
import { TOPICS } from '../src/config';
import type { ConnectionState } from '../src/types/mqtt';

class FakeTransport implements MqttTransport {
  connected = true;
  disposed = 0;
  subscriptions: string[][] = [];
  sent: { topic: string; payload: string }[] = [];
  suback: ((error?: Error) => void) | undefined;
  puback: ((error?: Error) => void) | undefined;
  constructor(public handlers: TransportHandlers) {}
  subscribe(topics: string[], done: (error?: Error) => void) { this.subscriptions.push(topics); this.suback = done; }
  publish(topic: string, payload: string, done: (error?: Error) => void) { this.sent.push({ topic, payload }); this.puback = done; }
  dispose() { ++this.disposed; this.connected = false; }
}
function setup() {
  const transports: FakeTransport[] = [];
  const statuses: { status: ConnectionState; detail?: string }[] = [];
  const messages: string[] = [];
  let reconnects = 0;
  const service = new MqttService({
    onStatus: (status, detail) => statuses.push({ status, detail }),
    onMessage: (_topic, payload) => messages.push(payload),
    onReconnect: () => ++reconnects,
  }, (_url, handlers) => { const transport = new FakeTransport(handlers); transports.push(transport); return transport; });
  function latest() { const transport = transports.at(-1); assert.ok(transport); return transport; }
  function ready() { latest().handlers.connect(); latest().suback?.(); }
  return { service, transports, statuses, messages, latest, ready, reconnects: () => reconnects };
}
test('não publica antes de SUBACK e só publica comando sem alterar estado recebido', async () => {
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt');
  await assert.rejects(f.service.publishLamp('ON'), /Conecte/);
  f.latest().handlers.connect();
  await assert.rejects(f.service.publishLamp('ON'), /Conecte/);
  f.latest().suback?.();
  assert.equal(f.service.connected, true);
  const sent = f.service.publishLamp('ON');
  f.latest().puback?.(); await sent;
  assert.deepEqual(f.latest().sent, [{ topic: TOPICS.command, payload: '{"action":"ON"}' }]);
  assert.deepEqual(f.messages, []);
  f.latest().handlers.message(TOPICS.lamp, '{"state":"ON"}', false);
  assert.deepEqual(f.messages, ['{"state":"ON"}']);
  f.service.disconnect();
});
test('trocar conexão descarta callbacks e mensagens da conexão anterior', () => {
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt'); const old = f.latest();
  old.handlers.connect();
  f.service.connect('ws://localhost:8080/mqtt');
  const count = f.statuses.length;
  old.suback?.(); old.handlers.message(TOPICS.lamp, '{"state":"ON"}', false); old.handlers.close();
  assert.equal(f.statuses.length, count);
  assert.equal(old.disposed, 1);
  assert.deepEqual(f.messages, []);
  f.ready();
  f.latest().handlers.message(TOPICS.lamp, '{"state":"OFF"}', false);
  assert.deepEqual(f.messages, ['{"state":"OFF"}']);
  f.service.disconnect();
});
test('timeout de inscrição encerra a conexão e oferece reconexão', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt'); f.latest().handlers.connect();
  t.mock.timers.tick(6000);
  assert.equal(f.latest().disposed, 1);
  assert.equal(f.statuses.at(-1)?.status, 'erro');
  assert.match(f.statuses.at(-1)?.detail ?? '', /Reconectar/);
  f.latest().suback?.();
  assert.equal(f.service.connected, false);
  f.service.disconnect();
});
test('desconectar rejeita envio pendente e ignora callback de envio tardio', async () => {
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt'); f.ready();
  const sent = f.service.publishLamp('OFF');
  const rejected = assert.rejects(sent, /cancelado/);
  f.service.disconnect();
  await rejected;
  f.latest().puback?.();
  assert.equal(f.service.connected, false);
});
test('falha de inscrição, erro de rede e fechamento têm feedback claro', () => {
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt');
  f.latest().handlers.connect(); f.latest().suback?.(new Error('Acesso recusado.'));
  assert.equal(f.statuses.at(-1)?.status, 'erro');
  f.service.connect('ws://localhost:8080/mqtt'); f.ready();
  f.latest().handlers.error(new Error('Falha de rede'));
  f.latest().handlers.close();
  assert.equal(f.statuses.at(-1)?.status, 'erro');
  assert.match(f.statuses.at(-1)?.detail ?? '', /Falha de rede/);
  f.latest().handlers.reconnect();
  assert.equal(f.reconnects(), 1);
  f.ready();
  assert.equal(f.statuses.at(-1)?.status, 'conectado');
  assert.equal(f.latest().subscriptions.length, 2);
  f.service.disconnect();
});
test('timeout de publicação libera o envio e callbacks posteriores não confirmam estado', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = setup();
  f.service.connect('ws://localhost:8080/mqtt'); f.ready();
  const rejected = assert.rejects(f.service.publishLamp('ON'), /Tempo esgotado/);
  t.mock.timers.tick(4000); await rejected;
  f.latest().puback?.();
  assert.deepEqual(f.messages, []);
  f.service.disconnect();
});
