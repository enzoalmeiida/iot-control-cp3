import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { SensorCard } from '../components/SensorCard';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Button, Card, Label, styles as ui } from '../components/ui';
import { formatTime } from '../utils/protocol';

export function DashboardScreen() {
  const { palette, status, connect, lamp, pending, command, messages, temperature, humidity } = useIoT();
  const lampText = !lamp ? 'Aguardando estado' : lamp.value === 'ON' ? 'Ligada' : 'Desligada';
  return <View style={styles.stack}>
    <View style={styles.heading}><View style={styles.headingCopy}><Label large>Seu ambiente, em tempo real.</Label><Label muted>Monitoramento e controle via MQTT</Label></View><ConnectionStatus /></View>
    {status !== 'conectado' && <Card>
      <Label>{status === 'conectando' ? 'Conectando ao ambiente…' : 'Conecte para receber as leituras'}</Label>
      <Label muted>Inicie o simulador no computador e conecte este aplicativo ao mesmo broker.</Label>
      <Button title={status === 'conectando' ? 'Conectando…' : 'Conectar / Reconectar'} disabled={status === 'conectando'} onPress={() => connect()} />
    </Card>}
    <View style={ui.row}>
      <SensorCard title="TEMPERATURA" unit="°C" reading={temperature} />
      <SensorCard title="UMIDADE" unit="%" reading={humidity} />
    </View>
    <Card>
      <View style={styles.lampHeading}>
        <View style={[styles.lampBadge, { backgroundColor: lamp?.value === 'ON' ? palette.accent : palette.raised }]}>
          <Text style={{ color: lamp?.value === 'ON' ? palette.onAccent : palette.muted, fontWeight: '800', fontSize: 17 }}>
            {lamp?.value ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}><Label muted>LÂMPADA VIRTUAL</Label><Label large>{lampText}</Label></View>
      </View>
      <Label muted>{formatTime(lamp?.updatedAt)}</Label>
      {status !== 'conectado' && lamp && <Label muted>Estado da última mensagem recebida. Conexão indisponível.</Label>}
      <View style={ui.row}>
        <View style={ui.grow}><Button title="Ligar" disabled={pending !== null} onPress={() => void command('ON')} testID="lamp-on" /></View>
        <View style={ui.grow}><Button title="Desligar" secondary disabled={pending !== null} onPress={() => void command('OFF')} testID="lamp-off" /></View>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: pending ? palette.warning : palette.muted, fontSize: 12, lineHeight: 18 }}>
        {pending ? 'Aguardando confirmação ' + pending + ' do dispositivo…' : 'O estado muda somente após a confirmação recebida por MQTT.'}
      </Text>
    </Card>
    <Card><Label>Atividade da sessão</Label><Label muted>{messages.length} de 10 mensagens no histórico. As mensagens são atualizadas automaticamente.</Label></Card>
  </View>;
}
const styles = StyleSheet.create({
  stack: { gap: 18 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  headingCopy: { flex: 1, minWidth: 210, gap: 7 },
  lampHeading: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  lampBadge: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
});
