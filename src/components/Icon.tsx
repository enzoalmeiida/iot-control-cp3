import React from 'react';
import Svg, { Path } from 'react-native-svg';
const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-5h4l1 3 3-1 2 3-2 3 2 3-2 3-3-1-1 3h-4l-1-3-3 1-2-3 2-3-2-3 2-3 3 1Z',
  temperature: 'M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0ZM12 8v10m-1 0h2',
  droplet: 'M12 3S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12-7-12Zm-3 13a3 3 0 0 0 3 3',
  bulb: 'M9 17c0-3-4-4-4-8a7 7 0 0 1 14 0c0 4-4 5-4 8Zm0 3h6m-5 2h4M9 10l3 3 3-3m-3 3v4',
  arrowUp: 'M12 20V4m-6 6 6-6 6 6',
  arrowDown: 'M12 4v16m-6-6 6 6 6-6',
  power: 'M12 3v8M6 5a9 9 0 1 0 12 0',
  wifi: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
  wifiOff: 'm3 3 18 18M2 8a16 16 0 0 1 3-2m5-2a16 16 0 0 1 12 4M5 12a11 11 0 0 1 5-2m5 1 4 1m-11 4a6 6 0 0 1 8 0m-4 4h.01',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  alert: 'm12 3 10 17H2Zm0 6v4m0 3h.01',
  chevron: 'm9 5 7 7-7 7',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  moon: 'M20 14A8 8 0 0 1 10 4a9 9 0 1 0 10 10Z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16',
  users: 'M8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-6 18v-3a6 6 0 0 1 12 0v3m2-18a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 5v2',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 10 3 3 6-6',
  server: 'M4 3h16v7H4Zm0 11h16v7H4ZM7 6.5h.01M7 17.5h.01m4-11h6m-6 11h6',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" accessible={false}><Path d={paths[name]} /></Svg>;
}
