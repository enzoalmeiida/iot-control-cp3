import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { SensorCard } from '../components/SensorCard';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Button, Card, Eyebrow, Label, PageHeading, styles as ui } from '../components/ui';
import { Icon } from '../components/Icon';
import { LampScene } from '../components/LampScene';
import { formatTime } from '../utils/protocol';
import { ageLabel, isFresh } from '../utils/telemetry';
import { useNow } from '../hooks/useNow';

export function DashboardScreen() {
  const { palette, status, retrying, connect, disconnect, lamp, pending, command, stats,
    temperature, humidity, temperatureSamples, humiditySamples, lastMessageAt, connectedAt } = useIoT();
  const now = useNow();
  const width = useWindowDimensions().width;
  const wide = width >= 850;
  const compact = width < 360;
  const fresh = status === 'conectado' && isFresh(temperature, now) && isFresh(humidity, now);
  const lampFresh = status === 'conectado' && isFresh(lamp, now);
  const lampText = !lamp ? 'Aguardando estado' : lamp.value === 'ON' ? 'Ligada' : 'Desligada';
  const on = lamp?.value === 'ON';
  return <View style={styles.stack}>
    <PageHeading eyebrow="SEU AMBIENTE" title="Visão geral" description="Um olhar para tudo que acontece." />
    <View style={[styles.hero, { backgroundColor: palette.tint, borderColor: palette.hero }]}>
      <View style={styles.heroBody}>
        <View style={{ flex: 1, gap: 9, zIndex: 1 }}><Text style={[styles.heroEyebrow, { color: palette.accent }]}>CONECTE. ACOMPANHE. CONTROLE.</Text><Text style={[styles.heroTitle, { color: palette.text }, compact && { fontSize: 24, lineHeight: 29 }]}>Um ambiente.{'\n'}Mais controle.</Text><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 19, maxWidth: 205 }}>Seus dispositivos, sempre por perto.</Text></View>
        <View style={{ marginRight: -8 }}><LampScene on={on && lampFresh} compact={compact} /></View>
      </View>
      <View style={[styles.heroFooter, { borderColor: palette.hero }]}>
        <ConnectionStatus />
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name={fresh ? 'check' : 'clock'} color={fresh ? palette.accent : palette.muted} size={14} /><Text testID="device-health" style={{ color: fresh ? palette.accent : palette.muted, fontSize: 10 }}>{fresh ? 'Dispositivo online' : status === 'conectado' ? 'Aguardando sensores' : 'Ambiente desconectado'}</Text></View>
      </View>
    </View>
    {status !== 'conectado' && <View style={ui.row}>
      <View style={ui.grow}><Button title={status === 'conectando' ? 'Conectando…' : 'Conectar ambiente'} icon={retrying ? 'refresh' : 'wifi'} loading={status === 'conectando'} onPress={() => connect()} /></View>
      {retrying && <View style={ui.grow}><Button title="Cancelar tentativa" secondary onPress={disconnect} /></View>}
    </View>}
    <View style={[styles.mainGrid, wide && { flexDirection: 'row', alignItems: 'stretch' }]}>
      <View style={{ flex: 1, gap: 12 }}>
        <View style={ui.between}><Eyebrow>SENSORES</Eyebrow><Text style={{ color: palette.muted, fontSize: 10 }}>Até 24 leituras por sensor</Text></View>
        <View style={[ui.row, { flex: 1 }]}>
          <SensorCard title="Temperatura" unit="°C" reading={temperature} samples={temperatureSamples} />
          <SensorCard title="Umidade" unit="%" reading={humidity} samples={humiditySamples} />
        </View>
      </View>
      <View style={[{ gap: 12 }, wide && { width: 340 }]}>
        <View style={ui.between}><Eyebrow>CONTROLE DO AMBIENTE</Eyebrow><Icon name="bulb" color={palette.muted} size={15} /></View>
        <Card style={{ flex: 1, gap: 17 }}>
          <View style={styles.lampHeading}>
            <View style={[styles.lampBadge, { backgroundColor: on && lampFresh ? palette.accent : palette.raised }]}><Icon name="bulb" color={on && lampFresh ? palette.onAccent : palette.muted} size={29} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={{ color: palette.muted, fontSize: 12 }}>Lâmpada virtual</Text><Text testID="lamp-state" style={[styles.lampState, { color: palette.text }]}>{lampText}</Text></View>
            {pending && <ActivityIndicator size="small" color={palette.accent} />}
          </View>
          <View style={{ gap: 5 }}>
            <Text style={{ color: pending ? palette.warning : palette.muted, fontSize: 11, lineHeight: 17 }} accessibilityLiveRegion="polite">
              {pending ? 'Aguardando confirmação para ' + (pending === 'ON' ? 'ligar…' : 'desligar…') : !lamp ? 'Conecte o simulador para receber o estado.' : lampFresh ? 'Estado confirmado pelo dispositivo' : 'Último estado recebido · sem atualização'}
            </Text>
            {lamp && <Text style={{ color: palette.muted, fontSize: 10 }}>Atualizado às {formatTime(lamp.updatedAt)}</Text>}
          </View>
          <View style={ui.row}>
            <View style={ui.grow}><Button title="Ligar" icon="power" disabled={pending !== null} onPress={() => void command('ON')} testID="lamp-on" /></View>
            <View style={ui.grow}><Button title="Desligar" secondary disabled={pending !== null} onPress={() => void command('OFF')} testID="lamp-off" /></View>
          </View>
          <View style={[styles.confirmation, { borderColor: palette.border }]}><Icon name="shield" color={palette.accent} size={15} /><Text style={{ flex: 1, color: palette.muted, fontSize: 10, lineHeight: 16 }}>Você envia o comando. O dispositivo confirma a mudança.</Text></View>
        </Card>
      </View>
    </View>
    <Card style={{ gap: 17 }}>
      <View style={ui.between}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name="pulse" color={palette.accent} size={17} /><Label>Atividade da sessão</Label></View><Text style={{ color: palette.muted, fontSize: 10 }}>{connectedAt ? 'Conectado há ' + Math.floor((now - connectedAt) / 60000) + ' min' : 'Conexão sob seu controle'}</Text></View>
      <View style={styles.metrics}>
        {[{ label: 'RECEBIDAS', value: stats.received }, { label: 'ENVIADAS', value: stats.sent }, { label: 'ÚLTIMA LEITURA', value: ageLabel(lastMessageAt ?? undefined, now) }].map(item => <View key={item.label} style={{ flex: 1, gap: 5 }}><Text style={{ color: palette.muted, fontSize: 8, fontWeight: '600', letterSpacing: 0.6 }}>{item.label}</Text><Text style={{ color: palette.text, fontSize: typeof item.value === 'number' ? 23 : 14, fontWeight: '700' }}>{item.value}</Text></View>)}
      </View>
    </Card>
  </View>;
}
const styles = StyleSheet.create({
  stack: { gap: 22 },
  hero: { borderWidth: 1, borderRadius: 25, paddingHorizontal: 20, paddingTop: 11, overflow: 'hidden' },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 150 },
  heroEyebrow: { fontSize: 7, fontWeight: '800', letterSpacing: 0.9 },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 33 },
  heroFooter: { borderTopWidth: 1, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  mainGrid: { gap: 22 },
  lampHeading: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  lampBadge: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lampState: { fontSize: 23, fontWeight: '700', letterSpacing: -0.5 },
  confirmation: { borderTopWidth: 1, paddingTop: 13, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  metrics: { flexDirection: 'row', gap: 12 },
});
