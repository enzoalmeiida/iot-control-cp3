import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Button, Card, Label, styles as ui } from '../components/ui';
import { GROUP, TOPIC_PREFIX } from '../config';

export function SettingsScreen() {
  const { palette, preferences, saveBroker, changeTheme, connect, disconnect, status } = useIoT();
  const [url, setUrl] = useState(preferences.brokerUrl);
  const [saving, setSaving] = useState(false);
  useEffect(() => setUrl(preferences.brokerUrl), [preferences.brokerUrl]);
  async function save(andConnect: boolean) {
    setSaving(true);
    try { if (await saveBroker(url)) { if (andConnect) connect(url.trim()); } }
    finally { setSaving(false); }
  }
  return <View style={{ gap: 18 }}>
    <Label large>Configurações</Label>
    <Label muted>Conexão, aparência e identificação do grupo</Label>
    <Card>
      <View style={styles.between}><Label>Broker MQTT</Label><ConnectionStatus /></View>
      <Label muted>Endereço WebSocket (WS/WSS)</Label>
      <TextInput accessibilityLabel="URL WebSocket do broker" testID="broker-url"
        value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url"
        placeholder="wss://test.mosquitto.org:8081/mqtt" placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, backgroundColor: palette.raised, borderColor: palette.border }]} />
      <Label muted>Teste padrão: test.mosquitto.org · porta WSS 8081 · caminho /mqtt. A porta 1883 não é WebSocket.</Label>
      <Button title={saving ? 'Salvando…' : 'Salvar endereço'} disabled={saving} secondary onPress={() => void save(false)} />
      <View style={ui.row}>
        <View style={ui.grow}><Button title={status === 'conectando' ? 'Reconectar' : 'Conectar'} disabled={saving} onPress={() => void save(true)} /></View>
        <View style={ui.grow}><Button title="Desconectar" secondary onPress={disconnect} /></View>
      </View>
    </Card>
    <Card>
      <View style={styles.between}>
        <View style={{ flex: 1, gap: 6 }}><Label>Tema {preferences.theme === 'dark' ? 'Dark' : 'Light'}</Label><Label muted>Salvo neste dispositivo</Label></View>
        <Switch accessibilityLabel="Tema escuro" testID="theme-toggle" value={preferences.theme === 'dark'}
          onValueChange={value => changeTheme(value ? 'dark' : 'light')}
          trackColor={{ false: palette.border, true: palette.accent }} thumbColor={preferences.theme === 'dark' ? '#ffffff' : '#62758c'} />
      </View>
    </Card>
    <Card>
      <Label>Checkpoint 3 · Mobile & IoT</Label>
      {GROUP.map(member => <Text key={member.rm} style={{ color: palette.text, fontSize: 14, lineHeight: 22 }}>{member.name} — {member.rm}</Text>)}
      <Label muted>Identificador exclusivo dos tópicos</Label>
      <Text selectable style={{ color: palette.accent, fontSize: 12, lineHeight: 18 }}>{TOPIC_PREFIX}</Text>
    </Card>
  </View>;
}
const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  input: { borderWidth: 1, padding: 14, minHeight: 52, borderRadius: 12, fontSize: 14 },
});
