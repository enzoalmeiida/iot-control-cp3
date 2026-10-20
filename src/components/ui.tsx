import React from 'react';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useIoT } from '../context/IoTContext';

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { palette } = useIoT();
  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</View>;
}
export function Label({ children, muted = false, large = false }: PropsWithChildren<{ muted?: boolean; large?: boolean }>) {
  const { palette } = useIoT();
  return <Text style={[large ? styles.large : styles.text, { color: muted ? palette.muted : palette.text }]}>{children}</Text>;
}
export function Button({ title, onPress, disabled = false, secondary = false, testID }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string;
}) {
  const { palette } = useIoT();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} accessibilityLabel={title}
    testID={testID} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, {
      backgroundColor: secondary ? palette.raised : palette.accent,
      opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
      borderColor: palette.border,
    }]}>
    <Text style={[styles.buttonText, { color: secondary ? palette.text : palette.onAccent }]}>{title}</Text>
  </Pressable>;
}
export const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 14 },
  text: { fontSize: 15, lineHeight: 22 },
  large: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  button: { borderRadius: 13, minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  grow: { flex: 1, minWidth: 135 },
});
