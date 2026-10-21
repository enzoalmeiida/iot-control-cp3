import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Icon } from './src/components/Icon';
import type { IconName } from './src/components/Icon';
import { IconButton } from './src/components/ui';
import type { Screen } from './src/types/mqtt';

const tabs: { title: Screen; icon: IconName }[] = [
  { title: 'Dashboard', icon: 'home' }, { title: 'Histórico', icon: 'pulse' }, { title: 'Configurações', icon: 'settings' },
];
function Shell() {
  const { loaded, palette, preferences, detail, notice, status, dismissNotice, changeTheme, messages } = useIoT();
  const [screen, setScreen] = useState<Screen>('Dashboard');
  const wide = useWindowDimensions().width >= 850;
  if (!loaded) return <View style={[styles.loading, { backgroundColor: palette.background }]}><View style={[styles.brandMark, { backgroundColor: palette.accent }]}><Icon name="home" color={palette.onAccent} size={24} /></View><Text style={{ color: palette.text, fontSize: 23, fontWeight: '700' }}>IoT Control</Text><ActivityIndicator color={palette.accent} /><Text style={{ color: palette.muted, fontSize: 12 }}>Preparando seu ambiente…</Text></View>;
  const noticeColor = notice?.tone === 'error' ? palette.danger : notice?.tone === 'warning' ? palette.warning : notice?.tone === 'success' ? palette.accent : palette.humidity;
  return <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
    <StatusBar style={preferences.theme === 'dark' ? 'light' : 'dark'} />
    <View style={[styles.topbar, { borderBottomColor: palette.border }]}><View style={styles.topbarContent}>
      <View style={[styles.brandMark, { backgroundColor: palette.accent }]}><Icon name="home" color={palette.onAccent} size={24} /></View>
      <View><Text style={[styles.brand, { color: palette.text }]}>IoT Control<Text style={{ color: palette.accent }}>.</Text></Text><Text style={[styles.kicker, { color: palette.muted }]}>SUA CASA. MAIS INTELIGENTE.</Text></View>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        {wide && <Text style={{ color: palette.muted, fontSize: 11 }}>FIAP · Checkpoint 03</Text>}
        <IconButton icon={preferences.theme === 'dark' ? 'sun' : 'moon'} label="Alternar tema" testID="header-theme" onPress={() => changeTheme(preferences.theme === 'dark' ? 'light' : 'dark')} />
      </View>
    </View></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView key={screen} testID="screen-scroll" style={{ flex: 1 }} contentContainerStyle={[styles.scroll, wide && { padding: 32 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.content, !wide && { maxWidth: 560 }]}>
          {detail !== '' && <View accessibilityLiveRegion="polite" testID="connection-detail" style={[styles.notice, { backgroundColor: palette.surface, borderColor: status === 'erro' ? palette.danger : palette.border }]}><Icon name={status === 'erro' ? 'alert' : 'refresh'} color={status === 'erro' ? palette.danger : palette.muted} size={18} /><Text style={{ flex: 1, color: status === 'erro' ? palette.danger : palette.muted, fontSize: 12, lineHeight: 19 }}>{detail}</Text></View>}
          {notice && <View accessibilityLiveRegion="polite" testID="notice" style={[styles.notice, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Icon name={notice.tone === 'success' ? 'check' : notice.tone === 'warning' || notice.tone === 'error' ? 'alert' : 'wifi'} color={noticeColor} size={19} />
            <Text style={{ flex: 1, color: palette.text, fontSize: 12, lineHeight: 19 }}>{notice.text}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar aviso" testID="dismiss-notice" onPress={dismissNotice} hitSlop={12} style={{ padding: 5 }}><Icon name="close" color={palette.muted} size={16} /></Pressable>
          </View>}
          {screen === 'Dashboard' ? <DashboardScreen /> : screen === 'Histórico' ? <HistoryScreen /> : <SettingsScreen />}
          <View style={styles.footer}><View style={{ backgroundColor: palette.accent, width: 4, height: 4, borderRadius: 2 }} /><Text style={{ color: palette.muted, fontSize: 9, letterSpacing: 0.5 }}>FIAP · MOBILE DEVELOPMENT & IoT</Text></View>
        </View>
      </ScrollView>
      <View style={[styles.navigation, { backgroundColor: palette.surface, borderTopColor: palette.border }]}><View style={styles.navigationContent} accessibilityRole="tablist">
        {tabs.map(tab => <Pressable key={tab.title} accessibilityRole="tab" accessibilityLabel={tab.title} accessibilityState={{ selected: screen === tab.title }}
          testID={'tab-' + tab.title} onPress={() => setScreen(tab.title)} style={({ pressed }) => [styles.tab, { backgroundColor: screen === tab.title ? palette.tint : 'transparent', opacity: pressed ? 0.65 : 1 }]}>
          <View style={{ position: 'relative' }}><Icon name={tab.icon} color={screen === tab.title ? palette.accent : palette.muted} size={21} />
            {tab.title === 'Histórico' && messages.length > 0 && <View style={[styles.badge, { backgroundColor: palette.accent }]}><Text style={{ color: palette.onAccent, fontSize: 8, fontWeight: '800' }}>{messages.length}</Text></View>}
          </View>
          <Text style={[styles.tabText, { color: screen === tab.title ? palette.accent : palette.muted }]}>{tab.title}</Text>
        </Pressable>)}
      </View></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export default function App() {
  return <SafeAreaProvider><IoTProvider><Shell /></IoTProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 },
  topbar: { borderBottomWidth: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  topbarContent: { width: '100%', maxWidth: 1080, flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 21, fontWeight: '800', letterSpacing: -0.8 },
  kicker: { fontSize: 7, fontWeight: '600', letterSpacing: 1.2, marginTop: 4 },
  scroll: { padding: 20, alignItems: 'center' }, content: { width: '100%', maxWidth: 1080, gap: 18 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  navigation: { borderTopWidth: 1, padding: 10, alignItems: 'center' },
  navigationContent: { flexDirection: 'row', width: '100%', maxWidth: 560, gap: 5 },
  tab: { flex: 1, minHeight: 58, justifyContent: 'center', alignItems: 'center', borderRadius: 17, gap: 5 },
  tabText: { fontSize: 10, fontWeight: '600' },
  badge: { position: 'absolute', right: -12, top: -5, minWidth: 16, height: 15, borderRadius: 7, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 8, marginBottom: 3, minHeight: 28 },
});
