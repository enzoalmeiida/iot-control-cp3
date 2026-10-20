import React from 'react';
import { View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { MessageItem } from '../components/MessageItem';
import { Card, Label } from '../components/ui';

export function HistoryScreen() {
  const { messages } = useIoT();
  return <View style={{ gap: 16 }}>
    <Label large>Histórico de mensagens</Label>
    <Label muted>As 10 mais recentes desta sessão · enviadas e recebidas</Label>
    {messages.length === 0
      ? <Card><Label>Nenhuma mensagem ainda</Label><Label muted>Conecte ao broker e inicie o simulador para acompanhar os tópicos e payloads.</Label></Card>
      : messages.map(message => <MessageItem key={message.id} message={message} />)}
  </View>;
}
