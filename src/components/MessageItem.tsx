import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { MessageEntry } from '../types/mqtt';
import { formatTime } from '../utils/protocol';
import { Card } from './ui';

export function MessageItem({ message }: { message: MessageEntry }) {
  const { palette } = useIoT();
  return <Card>
    <View style={styles.row}>
      <Text style={[styles.direction, { color: message.direction === 'enviada' ? palette.accent : palette.text }]}>
        {message.direction === 'enviada' ? '↑ ENVIADA' : '↓ RECEBIDA'}
      </Text>
      <Text style={{ color: palette.muted, fontSize: 12 }}>{formatTime(message.timestamp)}</Text>
    </View>
    <Text selectable style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>{message.topic}</Text>
    <Text selectable style={[styles.payload, { color: palette.text, backgroundColor: palette.raised }]}>{message.payload || '(payload vazio)'}</Text>
    {!message.valid && <Text style={{ color: palette.danger, fontSize: 12 }}>Payload inválido · não aplicado aos sensores</Text>}
  </Card>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  direction: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  payload: { fontFamily: 'monospace', padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 20 },
});
