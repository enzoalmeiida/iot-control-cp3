import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { Reading } from '../types/mqtt';
import { formatTime } from '../utils/protocol';
import { Card, Label } from './ui';

export function SensorCard({ title, unit, reading }: { title: string; unit: string; reading: Reading<number> | null }) {
  const { palette, status } = useIoT();
  return <Card style={styles.card}>
    <Label muted>{title}</Label>
    <View style={styles.valueRow}>
      <Text testID={unit === '°C' ? 'temperature-value' : 'humidity-value'} style={[styles.value, { color: palette.text }]}>{reading ? reading.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'}</Text>
      <Text style={[styles.unit, { color: palette.accent }]}>{unit}</Text>
    </View>
    <Text style={[styles.time, { color: palette.muted }]}>{formatTime(reading?.updatedAt)}</Text>
    {reading && status !== 'conectado' && <Text style={[styles.time, { color: palette.warning }]}>Último valor · sem conexão</Text>}
  </Card>;
}
const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  value: { fontSize: 42, fontWeight: '700', letterSpacing: -1.5 },
  unit: { fontSize: 22, fontWeight: '600' },
  time: { fontSize: 12, lineHeight: 18 },
});
