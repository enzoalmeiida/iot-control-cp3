import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
export function ConnectionStatus() {
  const { status, palette } = useIoT();
  const color = status === 'conectado' ? palette.accent : status === 'erro' ? palette.danger : palette.muted;
  return <View testID="connection-status" style={[styles.badge, { backgroundColor: palette.raised }]} accessibilityLiveRegion="polite">
    {status === 'conectando' ? <ActivityIndicator size="small" color={color} /> : <View style={[styles.dot, { backgroundColor: color }]} />}
    <Text style={[styles.text, { color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
  </View>;
}
const styles = StyleSheet.create({
  badge: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 24, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700' },
});
