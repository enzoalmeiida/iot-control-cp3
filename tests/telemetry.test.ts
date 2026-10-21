import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appendSample, ageLabel, isFresh, summarize } from '../src/utils/telemetry';
import { filterMessages } from '../src/utils/history';
import type { MessageEntry } from '../src/types/mqtt';

test('amostras mantêm as últimas 24 e estatísticas usam apenas valores recebidos', () => {
  let samples = [{ value: 0, updatedAt: 0 }];
  const original = samples;
  for (let i = 1; i <= 30; i++) samples = appendSample(samples, { value: i, updatedAt: i });
  assert.equal(original.length, 1);
  assert.equal(samples.length, 24);
  assert.equal(samples[0]?.value, 7);
  assert.deepEqual(summarize(samples), { min: 7, max: 30, mean: 18.5 });
  assert.equal(summarize([]), null);
});
test('frescor do dispositivo expira mesmo que o broker continue conectado', () => {
  const reading = { value: 24, updatedAt: 1000 };
  assert.equal(isFresh(reading, 11000), true);
  assert.equal(isFresh(reading, 11001), false);
  assert.equal(isFresh(null, 11000), false);
  assert.equal(ageLabel(undefined, 1000), 'Sem leituras');
  assert.equal(ageLabel(1000, 1500), 'Agora');
  assert.equal(ageLabel(1000, 6000), 'Há 5 s');
  assert.equal(ageLabel(1000, 121000), 'Há 2 min');
});
test('busca e filtros combinam conteúdo, tópico, direção e validade sem alterar o histórico', () => {
  const entries: MessageEntry[] = [
    { id: '1', topic: 'sensor/temperatura', payload: '{"value":24}', timestamp: 1, direction: 'recebida', valid: true },
    { id: '2', topic: 'lampada/comando', payload: '{"action":"ON"}', timestamp: 2, direction: 'enviada', valid: true },
    { id: '3', topic: 'sensor/umidade', payload: 'INVÁLIDO', timestamp: 3, direction: 'recebida', valid: false },
  ];
  assert.equal(filterMessages(entries, 'Enviadas', ' on ').length, 1);
  assert.equal(filterMessages(entries, 'Recebidas', 'SENSOR').length, 2);
  assert.equal(filterMessages(entries, 'Inválidas', 'inválido').length, 1);
  assert.equal(filterMessages(entries, 'Todas', 'inexistente').length, 0);
  assert.equal(entries.length, 3);
});
