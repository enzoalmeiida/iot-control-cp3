import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { MessageEntry } from '../types/mqtt';
import { formatTime } from '../utils/protocol';
import { prettyPayload } from '../utils/history';
import { Card } from './ui';
import { Icon } from './Icon';
export function MessageItem({ message }: { message: MessageEntry }) {
  const { palette } = useIoT();
  const sent = message.direction === 'enviada';
  const parts = message.topic.split('/');
  const topicName = parts.slice(-2).join(' / ');
  const color = !message.valid ? palette.danger : sent ? palette.accent : palette.humidity;
  return <Card testID="message-entry" style={{ gap: 13 }}>
    <View style={styles.row}>
      <View style={styles.direction}><View style={{ padding: 7, backgroundColor: palette.raised, borderRadius: 10 }}><Icon name={sent ? 'arrowUp' : 'arrowDown'} color={color} size={16} /></View><View style={{ gap: 3 }}><Text style={{ color, fontSize: 11, fontWeight: '700' }}>{sent ? 'ENVIADA' : 'RECEBIDA'}</Text><Text style={{ color: palette.text, fontSize: 12, fontWeight: '600' }}>{topicName}</Text></View></View>
      <Text style={{ color: palette.muted, fontSize: 10 }}>{formatTime(message.timestamp)}</Text>
    </View>
    <Text selectable style={{ color: palette.muted, fontSize: 10, lineHeight: 16 }}>{message.topic}</Text>
    <Text selectable style={[styles.payload, { color: palette.text, backgroundColor: palette.background }]}>{prettyPayload(message.payload)}</Text>
    {!message.valid && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Icon name="alert" color={palette.danger} size={14} /><Text style={{ color: palette.danger, fontSize: 11 }}>Payload inválido · não aplicado aos sensores</Text></View>}
    {message.retained && <Text style={{ color: palette.muted, fontSize: 10 }}>Mensagem retida pelo broker</Text>}
  </Card>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  direction: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  payload: { fontFamily: 'monospace', padding: 13, borderRadius: 12, fontSize: 12, lineHeight: 19 },
});
