import type { Reading, SessionStats } from '../types/mqtt';
export const STALE_AFTER_MS = 10000;
export const SAMPLE_LIMIT = 24;
export const initialStats: SessionStats = { received: 0, sent: 0, invalid: 0, reconnects: 0 };
export function appendSample(samples: Reading<number>[], sample: Reading<number>): Reading<number>[] {
  return [...samples, sample].slice(-SAMPLE_LIMIT);
}
export function isFresh(reading: Reading<unknown> | null, now: number): boolean {
  return reading !== null && !reading.retained && now - reading.updatedAt <= STALE_AFTER_MS;
}
export function summarize(samples: Reading<number>[]) {
  if (!samples.length) return null;
  const values = samples.map(sample => sample.value);
  return { min: Math.min(...values), max: Math.max(...values), mean: values.reduce((sum, n) => sum + n, 0) / values.length };
}
export function ageLabel(timestamp: number | undefined, now: number): string {
  if (timestamp === undefined) return 'Sem leituras';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 2) return 'Agora';
  if (seconds < 60) return 'Há ' + seconds + ' s';
  return 'Há ' + Math.floor(seconds / 60) + ' min';
}
