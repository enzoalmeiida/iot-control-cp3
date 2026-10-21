import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Button, Card, Eyebrow, Label, PageHeading, styles as ui } from '../components/ui';
import { Icon } from '../components/Icon';
import { DEFAULT_BROKER, GROUP, TOPIC_PREFIX } from '../config';
import { validateBrokerUrl } from '../utils/protocol';

export function SettingsScreen() {
  const { palette, preferences, saveBroker, changeTheme, connect, disconnect, status, stats, activeBroker } = useIoT();
  const [url, setUrl] = useState(preferences.brokerUrl);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  useEffect(() => setUrl(preferences.brokerUrl), [preferences.brokerUrl]);
  let validation = '';
  try { validateBrokerUrl(url); } catch (error) { validation = error instanceof Error ? error.message : 'Endereço inválido.'; }
  async function save(andConnect: boolean) {
    setTouched(true);
    if (validation) return;
    setSaving(true);
    try { if (await saveBroker(url) && andConnect) connect(url.trim()); }
    finally { setSaving(false); }
  }
  return <View style={{ gap: 22 }}>
    <PageHeading eyebrow="DO SEU JEITO" title="Configurações" description="Seu ambiente. Suas preferências." />
    <Card>
      <View style={ui.between}><View style={styles.sectionTitle}><Icon name="server" color={palette.accent} size={19} /><Label>Conexão do ambiente</Label></View><ConnectionStatus /></View>
      <Text style={[styles.description, { color: palette.muted }]}>Escolha o servidor que conecta o aplicativo aos seus dispositivos.</Text>
      <Eyebrow>URL WEBSOCKET DO BROKER</Eyebrow>
      <TextInput accessibilityLabel="URL WebSocket do broker" testID="broker-url" value={url} onChangeText={setUrl} onBlur={() => setTouched(true)}
        autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder={DEFAULT_BROKER} placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, backgroundColor: palette.background, borderColor: touched && validation ? palette.danger : palette.border }]} />
      {touched && validation !== '' ? <Text testID="broker-validation" style={{ color: palette.danger, fontSize: 12, lineHeight: 18 }}>{validation}</Text> : <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 17 }}>Use ws:// ou wss:// com a porta WebSocket. O endereço é salvo somente neste dispositivo.</Text>}
      <View style={ui.row}>
        <View style={ui.grow}><Button title="Salvar endereço" secondary disabled={saving} onPress={() => void save(false)} /></View>
        <View style={ui.grow}><Button title={status === 'conectado' || status === 'conectando' ? 'Reconectar' : 'Conectar'} icon={status === 'conectado' ? 'refresh' : 'wifi'} loading={saving} onPress={() => void save(true)} /></View>
      </View>
      <Button title="Desconectar" icon="wifiOff" secondary onPress={disconnect} />
      <View style={[styles.preset, { backgroundColor: palette.tint, borderColor: palette.hero }]}>
        <View style={{ flex: 1, gap: 5 }}><Text style={{ color: palette.accent, fontSize: 11, fontWeight: '700' }}>Broker público de demonstração</Text><Text style={{ color: palette.muted, fontSize: 10 }}>Mosquitto · WSS · porta 8081 · /mqtt</Text></View>
        <Button title="Usar padrão" secondary onPress={() => { setUrl(DEFAULT_BROKER); setTouched(false); }} />
      </View>
      {activeBroker && <Text selectable style={{ color: palette.muted, fontSize: 10, lineHeight: 17 }}>Último endereço usado: {activeBroker}</Text>}
    </Card>
    <Card>
      <View style={ui.between}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}><View style={[styles.iconTile, { backgroundColor: palette.raised }]}><Icon name={preferences.theme === 'dark' ? 'moon' : 'sun'} color={palette.accent} /></View><View style={{ gap: 5 }}><Label>Tema {preferences.theme === 'dark' ? 'Dark' : 'Light'}</Label><Text style={{ color: palette.muted, fontSize: 11 }}>Conforto em cada detalhe</Text></View></View>
        <Switch accessibilityLabel="Tema escuro" testID="theme-toggle" value={preferences.theme === 'dark'} onValueChange={value => changeTheme(value ? 'dark' : 'light')} trackColor={{ false: palette.border, true: palette.accent }} thumbColor={preferences.theme === 'dark' ? '#ffffff' : '#8ca2b6'} />
      </View>
      <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 17 }}>A aparência escolhida é aplicada em todas as telas e recuperada quando você voltar.</Text>
    </Card>
    <Card>
      <View style={styles.sectionTitle}><Icon name="pulse" color={palette.accent} size={19} /><Label>Diagnóstico da sessão</Label></View>
      <View style={ui.between}><Text style={{ color: palette.muted, fontSize: 12 }}>Reconexões automáticas</Text><Text style={{ color: palette.text, fontWeight: '700' }}>{stats.reconnects}</Text></View>
      <View style={ui.between}><Text style={{ color: palette.muted, fontSize: 12 }}>Mensagens inválidas descartadas</Text><Text style={{ color: stats.invalid ? palette.warning : palette.text, fontWeight: '700' }}>{stats.invalid}</Text></View>
      <Button title={topicsOpen ? 'Ocultar tópicos MQTT' : 'Consultar tópicos MQTT'} icon="code" secondary onPress={() => setTopicsOpen(!topicsOpen)} />
      {topicsOpen && <View testID="topic-reference" style={{ gap: 12 }}><Text selectable style={{ color: palette.muted, fontSize: 10, lineHeight: 17 }}>Prefixo: {TOPIC_PREFIX}</Text>
        {[['sensor/temperatura', 'Recebe', '{"value":24.5}'], ['sensor/umidade', 'Recebe', '{"value":58}'], ['lampada/comando', 'Envia', '{"action":"ON"}'], ['lampada/estado', 'Recebe', '{"state":"ON"}']].map(([topic, direction, payload]) => <View key={topic} style={{ padding: 12, backgroundColor: palette.background, borderRadius: 12, gap: 5 }}><Text selectable style={{ color: palette.accent, fontSize: 11 }}>{direction} · {topic}</Text><Text selectable style={{ color: palette.text, fontFamily: 'monospace', fontSize: 11 }}>{payload}</Text></View>)}
      </View>}
    </Card>
    <Card>
      <View style={styles.sectionTitle}><Icon name="users" color={palette.accent} size={19} /><Label>Feito pelo nosso grupo</Label></View>
      {GROUP.map((member, index) => <View key={member.rm} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}><View style={[styles.avatar, { backgroundColor: palette.raised }]}><Text style={{ color: palette.accent, fontSize: 12, fontWeight: '700' }}>{['EA', 'GM', 'GM'][index]}</Text></View><View style={{ gap: 3 }}><Text style={{ color: palette.text, fontSize: 13, fontWeight: '600' }}>{member.name}</Text><Text style={{ color: palette.muted, fontSize: 10 }}>{member.rm}</Text></View></View>)}
      <View style={[ui.divider, { backgroundColor: palette.border }]} />
      <Text style={{ color: palette.muted, fontSize: 10, lineHeight: 18 }}>IoT Control 2.0 · Checkpoint 3 · FIAP 3ESPV{'\n'}React Native + Expo + TypeScript</Text>
    </Card>
  </View>;
}
const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  description: { fontSize: 12, lineHeight: 19 },
  input: { borderWidth: 1, padding: 14, minHeight: 52, borderRadius: 14, fontSize: 12 },
  iconTile: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  preset: { padding: 12, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  avatar: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
