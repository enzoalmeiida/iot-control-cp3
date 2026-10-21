import React from 'react';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export function Card({ children, style, testID }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; testID?: string }>) {
  const { palette } = useIoT();
  return <View testID={testID} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</View>;
}
export function Label({ children, muted = false, large = false }: PropsWithChildren<{ muted?: boolean; large?: boolean }>) {
  const { palette } = useIoT();
  return <Text style={[large ? styles.large : styles.text, { color: muted ? palette.muted : palette.text }]}>{children}</Text>;
}
export function Eyebrow({ children }: PropsWithChildren) {
  const { palette } = useIoT();
  return <Text style={[styles.eyebrow, { color: palette.muted }]}>{children}</Text>;
}
export function PageHeading({ eyebrow, title, description, accessory }: {
  eyebrow: string; title: string; description?: string; accessory?: React.ReactNode;
}) {
  const { palette } = useIoT();
  return <View style={styles.heading}>
    <View style={{ flex: 1, gap: 7 }}><Eyebrow>{eyebrow}</Eyebrow><Text accessibilityRole="header" style={[styles.pageTitle, { color: palette.text }]}>{title}</Text>{description && <Label muted>{description}</Label>}</View>
    {accessory}
  </View>;
}
export function Button({ title, onPress, disabled = false, secondary = false, testID, icon, loading = false }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string; icon?: IconName; loading?: boolean;
}) {
  const { palette } = useIoT();
  const color = secondary ? palette.text : palette.onAccent;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }}
    accessibilityLabel={title} testID={testID} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.button, {
      backgroundColor: secondary ? palette.raised : palette.accent,
      opacity: disabled ? 0.4 : pressed ? 0.75 : 1, borderColor: secondary ? palette.border : 'transparent',
    }]}>
    {loading ? <ActivityIndicator size="small" color={color} /> : icon && <Icon name={icon} color={color} size={18} />}
    <Text style={[styles.buttonText, { color }]}>{title}</Text>
  </Pressable>;
}
export function IconButton({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const { palette } = useIoT();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} testID={testID} hitSlop={6} onPress={onPress}
    style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.raised, opacity: pressed ? 0.65 : 1 }]}>
    <Icon name={icon} color={palette.text} size={20} />
  </Pressable>;
}
export function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  const { palette } = useIoT();
  return <Card style={{ alignItems: 'center', paddingVertical: 34, gap: 14 }}>
    <View style={{ backgroundColor: palette.raised, padding: 18, borderRadius: 22 }}><Icon name={icon} color={palette.accent} size={30} /></View>
    <Label>{title}</Label><Text style={{ color: palette.muted, lineHeight: 22, textAlign: 'center', maxWidth: 290 }}>{description}</Text>
  </Card>;
}
export const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 15 },
  text: { fontSize: 14, lineHeight: 21 },
  large: { fontSize: 21, fontWeight: '700', lineHeight: 28, letterSpacing: -0.5 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, lineHeight: 15 },
  pageTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -1.1, lineHeight: 37 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  button: { flexDirection: 'row', gap: 8, borderRadius: 15, minHeight: 50, paddingHorizontal: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  grow: { flex: 1, minWidth: 130 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  divider: { height: 1 },
});
