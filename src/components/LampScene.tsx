import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useIoT } from '../context/IoTContext';
export function LampScene({ on, compact = false }: { on: boolean; compact?: boolean }) {
  const { palette } = useIoT();
  return <Svg width={compact ? 88 : 126} height={compact ? 110 : 142} viewBox="0 0 150 160" accessible={false}>
    <Circle cx={83} cy={75} r={55} fill={palette.accent} opacity={0.05} />
    <Circle cx={83} cy={75} r={40} fill={palette.accent} opacity={0.06} />
    <Line x1={83} y1={6} x2={83} y2={48} stroke={palette.accent} opacity={0.5} strokeWidth={2} />
    {on && <Path d="M62 79 34 134h98l-28-55Z" fill={palette.accent} opacity={0.11} />}
    <Path d="M53 78c0-18 13-32 30-32s30 14 30 32Z" fill={palette.accent} opacity={on ? 0.95 : 0.35} />
    <Ellipse cx={83} cy={79} rx={30} ry={5} fill={palette.accent} opacity={0.8} />
    <Circle cx={83} cy={79} r={6} fill={on ? '#fff2cb' : palette.track} />
    <Line x1={21} y1={137} x2={138} y2={137} stroke={palette.accent} opacity={0.3} />
    <Rect x={35} y={120} width={70} height={17} rx={5} fill={palette.accent} opacity={0.12} />
    <Path d="M122 136v-22m0 11c-10-3-12-11-12-11s12-2 12 11Zm0-6c10-3 12-11 12-11s-12-2-12 11Z" stroke={palette.accent} fill="none" strokeWidth={1.8} opacity={0.7} />
  </Svg>;
}
