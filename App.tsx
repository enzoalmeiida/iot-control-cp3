import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { Screen } from './src/types/mqtt';

const tabs: Screen[] = ['Dashboard', 'Histórico', 'Configurações'];
function Shell() {
  const { loaded, palette, preferences, detail, notice, status } = useIoT();
  const [screen, setScreen] = useState<Screen>('Dashboard');
  if (!loaded) return <View style={[styles.loading, { backgroundColor: palette.background }]}><ActivityIndicator color={palette.accent} /><Text style={{ color: palette.text }}>Carregando preferências…</Text></View>;
  return <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
    <StatusBar style={preferences.theme === 'dark' ? 'light' : 'dark'} />
    <View style={[styles.topbar, { borderBottomColor: palette.border }]}>
      <View style={[styles.brandMark, { backgroundColor: palette.accent }]}><Text style={{ color: palette.onAccent, fontWeight: '900' }}>IoT</Text></View>
      <View><Text style={[styles.brand, { color: palette.text }]}>IoT Control</Text><Text style={[styles.kicker, { color: palette.muted }]}>AMBIENTE INTELIGENTE</Text></View>
      <Text style={[styles.version, { color: palette.accent }]}>CP 03</Text>
    </View>
    <ScrollView key={screen} style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {detail !== '' && <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: palette.raised, borderColor: palette.border }]}><Text style={{ color: status === 'erro' ? palette.danger : palette.muted, lineHeight: 21 }}>{detail}</Text></View>}
        {notice !== '' && <View accessibilityLiveRegion="polite" testID="notice" style={[styles.notice, { backgroundColor: palette.raised, borderColor: palette.border }]}><Text style={{ color: palette.text, lineHeight: 21 }}>{notice}</Text></View>}
        {screen === 'Dashboard' ? <DashboardScreen /> : screen === 'Histórico' ? <HistoryScreen /> : <SettingsScreen />}
        <Text style={[styles.footer, { color: palette.muted }]}>FIAP · 3ESPV · MQTT Publish / Subscribe</Text>
      </View>
    </ScrollView>
    <View style={[styles.navigation, { backgroundColor: palette.surface, borderTopColor: palette.border }]} accessibilityRole="tablist">
      {tabs.map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{ selected: screen === tab }} testID={'tab-' + tab}
        onPress={() => setScreen(tab)} style={[styles.tab, { backgroundColor: screen === tab ? palette.raised : 'transparent' }]}>
        <View style={[styles.tabIndicator, { backgroundColor: screen === tab ? palette.accent : 'transparent' }]} />
        <Text style={[styles.tabText, { color: screen === tab ? palette.accent : palette.muted }]}>{tab}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><IoTProvider><Shell /></IoTProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1 },
  brandMark: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  kicker: { fontSize: 9, letterSpacing: 1.7, marginTop: 3 },
  version: { marginLeft: 'auto', fontSize: 12, fontWeight: '800' },
  scroll: { padding: 20, alignItems: 'center' },
  content: { width: '100%', maxWidth: 780, gap: 18 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 14 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, padding: 10, gap: 5 },
  tab: { flex: 1, minHeight: 54, justifyContent: 'center', alignItems: 'center', borderRadius: 13, gap: 8 },
  tabIndicator: { width: 20, height: 3, borderRadius: 2 },
  tabText: { fontSize: 12, fontWeight: '700' },
  footer: { fontSize: 11, textAlign: 'center', marginVertical: 8, lineHeight: 18 },
});
