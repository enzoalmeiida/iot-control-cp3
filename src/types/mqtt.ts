export type ConnectionState = 'conectando' | 'conectado' | 'desconectado' | 'erro';
export type LampState = 'ON' | 'OFF';
export type ThemeName = 'light' | 'dark';
export type Screen = 'Dashboard' | 'Histórico' | 'Configurações';
export interface Reading<T> { value: T; updatedAt: number }
export interface Preferences { brokerUrl: string; theme: ThemeName }
export type NoticeTone = 'success' | 'info' | 'warning' | 'error';
export interface Notice { text: string; tone: NoticeTone }
export interface MessageEntry {
  id: string; topic: string; payload: string; timestamp: number;
  direction: 'enviada' | 'recebida'; valid: boolean; retained?: boolean;
}
export interface SessionStats { received: number; sent: number; invalid: number; reconnects: number }
export type Telemetry =
  | { kind: 'temperature'; value: number }
  | { kind: 'humidity'; value: number }
  | { kind: 'lamp'; value: LampState };
