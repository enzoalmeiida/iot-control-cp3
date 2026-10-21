import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { Reading } from '../types/mqtt';
import { useIoT } from '../context/IoTContext';
export function Sparkline({ samples, color }: { samples: Reading<number>[]; color: string }) {
  const { palette } = useIoT();
  if (samples.length < 2) return <View style={{ height: 44, justifyContent: 'center', gap: 9 }}><View style={{ borderBottomWidth: 1, borderStyle: 'dashed', borderColor: palette.border }} /><Text style={{ color: palette.muted, fontSize: 9 }}>Aguardando mais leituras</Text></View>;
  const values = samples.map(sample => sample.value);
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => ({ x: 3 + i / (values.length - 1) * 154, y: 35 - (value - min) / range * 28 }));
  const line = points.map((point, index) => (index ? 'L' : 'M') + point.x + ',' + point.y).join(' ');
  const last = points[points.length - 1];
  return <View accessible accessibilityLabel={'Tendência de ' + samples.length + ' leituras. Mínimo ' + min + ', máximo ' + max + '.'}>
    <Svg width="100%" height={44} viewBox="0 0 160 44" preserveAspectRatio="none" accessible={false}>
      <Line x1={0} x2={160} y1={38} y2={38} stroke={palette.border} strokeDasharray="3 4" />
      <Path d={line + ' L157,44 L3,44 Z'} fill={color} opacity={0.09} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {last && <Circle cx={last.x} cy={last.y} r={3} fill={color} />}
    </Svg>
  </View>;
}
