export const DEFAULT_BROKER = 'wss://test.mosquitto.org:8081/mqtt';
export const TOPIC_PREFIX = 'fiap/3espv/rm556900-rm554421-rm557290';
export function createTopics(prefix: string) { return {
  temperature: prefix + '/sensor/temperatura',
  humidity: prefix + '/sensor/umidade',
  command: prefix + '/lampada/comando',
  lamp: prefix + '/lampada/estado',
} as const; }
export const TOPICS = createTopics(TOPIC_PREFIX);
export const SUBSCRIPTIONS = [TOPICS.temperature, TOPICS.humidity, TOPICS.lamp];
export const GROUP = [
  { name: 'Enzo Almeida', rm: 'RM556900' },
  { name: 'Gabriel de Mello', rm: 'RM554421' },
  { name: 'Guilherme Moreira', rm: 'RM557290' },
] as const;
