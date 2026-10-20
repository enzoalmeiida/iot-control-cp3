import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';

export function ConnectionStatus() {
  const { status, palette } = useIoT();
  const color = status === 'conectado' ? palette.accent : status === 'erro' ? palette.danger : palette.warning;
  return <View style={[styles.badge, { backgroundColor: palette.raised }]} accessibilityLiveRegion="polite">
    {status === 'conectando' ? <ActivityIndicator size="small" color={color} /> : <View style={[styles.dot, { backgroundColor: color }]} />}
    <Text style={[styles.text, { color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
  </View>;
}
const styles = StyleSheet.create({
  badge: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 30 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});
