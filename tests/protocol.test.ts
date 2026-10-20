import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOPICS } from '../src/config';
import type { MessageEntry } from '../src/types/mqtt';
import { parseTelemetry, prependMessage, validateBrokerUrl } from '../src/utils/protocol';

test('aceita telemetria numérica e confirmação explícita da lâmpada', () => {
  assert.deepEqual(parseTelemetry(TOPICS.temperature, '{"value":24.5}'), { kind: 'temperature', value: 24.5 });
  assert.deepEqual(parseTelemetry(TOPICS.humidity, '{"value":58}'), { kind: 'humidity', value: 58 });
  assert.deepEqual(parseTelemetry(TOPICS.lamp, '{"state":"OFF"}'), { kind: 'lamp', value: 'OFF' });
  assert.equal(parseTelemetry(TOPICS.lamp, '{"action":"ON"}'), null);
});
test('descarta dados malformados, tipos incorretos, tópicos estranhos e valores fora da faixa', () => {
  for (const payload of ['{', 'null', '[]', '{}', '{"value":"24"}', '{"value":null}', '{"value":1e999}', '{"value":151}']) {
    assert.equal(parseTelemetry(TOPICS.temperature, payload), null, payload);
  }
  assert.equal(parseTelemetry(TOPICS.humidity, '{"value":101}'), null);
  assert.equal(parseTelemetry(TOPICS.humidity, '{"value":-1}'), null);
  assert.equal(parseTelemetry(TOPICS.lamp, '{"state":"on"}'), null);
  assert.equal(parseTelemetry('outro/topico', '{"value":24}'), null);
  assert.equal(parseTelemetry(TOPICS.temperature, ' '.repeat(2049)), null);
});
test('URL exige WebSocket e recusa credenciais e portas TCP usuais', () => {
  assert.equal(validateBrokerUrl(' wss://test.mosquitto.org:8081/mqtt '), 'wss://test.mosquitto.org:8081/mqtt');
  for (const input of ['mqtt://localhost:1883', 'ws://localhost:1883', 'wss://localhost:8883', 'abc', 'wss://user:pass@host/mqtt', 'wss://host/mqtt?token=secreto']) {
    assert.throws(() => validateBrokerUrl(input), Error, input);
  }
});
test('histórico mantém exatamente as dez mais recentes e não altera o array anterior', () => {
  let history: MessageEntry[] = [];
  const previous = history;
  for (let i = 1; i <= 14; i++) {
    history = prependMessage(history, { id: String(i), topic: 'teste', payload: '{}', timestamp: i, direction: i % 2 ? 'recebida' : 'enviada', valid: true });
  }
  assert.equal(previous.length, 0);
  assert.equal(history.length, 10);
  assert.equal(history[0]?.id, '14');
  assert.equal(history[9]?.id, '5');
});
