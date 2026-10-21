import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { Reading } from '../types/mqtt';
import { formatTime } from '../utils/protocol';
import { ageLabel, isFresh, summarize } from '../utils/telemetry';
import { useNow } from '../hooks/useNow';
import { Card } from './ui';
import { Icon } from './Icon';
import { Sparkline } from './Sparkline';

export function SensorCard({ title, unit, reading, samples }: {
  title: string; unit: string; reading: Reading<number> | null; samples: Reading<number>[];
}) {
  const { palette, status } = useIoT();
  const now = useNow();
  const temperature = unit === '°C';
  const color = temperature ? palette.temperature : palette.humidity;
  const fresh = status === 'conectado' && isFresh(reading, now);
  const summary = summarize(samples);
  const display = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return <Card style={styles.card}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: palette.raised }]}><Icon name={temperature ? 'temperature' : 'droplet'} color={color} size={20} /></View><View style={[styles.dot, { backgroundColor: !reading ? palette.muted : fresh ? palette.accent : palette.warning }]} /></View>
    <Text style={[styles.title, { color: palette.muted }]}>{title}</Text>
    <View style={styles.valueRow}>
      <Text testID={temperature ? 'temperature-value' : 'humidity-value'} style={[styles.value, { color: palette.text }]}>{reading ? display(reading.value) : '—'}</Text>
      <Text style={[styles.unit, { color }]}>{unit}</Text>
    </View>
    <Sparkline samples={samples} color={color} />
    <Text style={[styles.range, { color: palette.muted }]}>{summary ? 'Min ' + display(summary.min) + '  ·  Máx ' + display(summary.max) : 'Sem dados nesta sessão'}</Text>
    <View style={[styles.timestamp, { borderColor: palette.border }]}>
      <Text style={[styles.time, { color: reading && !fresh ? palette.warning : palette.muted }]}>{reading && !fresh ? 'Leitura antiga' : ageLabel(reading?.updatedAt, now)}</Text>
      {reading && <Text style={[styles.time, { color: palette.muted }]}>{formatTime(reading.updatedAt)}</Text>}
    </View>
  </Card>;
}
const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 144, padding: 16, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
  value: { fontSize: 34, fontWeight: '700', letterSpacing: -1.3, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 15, fontWeight: '600' },
  range: { fontSize: 9, lineHeight: 15 },
  timestamp: { borderTopWidth: 1, paddingTop: 9, gap: 4 },
  time: { fontSize: 10, lineHeight: 14 },
});
