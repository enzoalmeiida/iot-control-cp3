export type ConnectionState = 'conectando' | 'conectado' | 'desconectado' | 'erro';
export type LampState = 'ON' | 'OFF';
export type ThemeName = 'light' | 'dark';
export type Screen = 'Dashboard' | 'Histórico' | 'Configurações';
export interface Reading<T> { value: T; updatedAt: number }
export interface Preferences { brokerUrl: string; theme: ThemeName }
export interface MessageEntry {
  id: string;
  topic: string;
  payload: string;
  timestamp: number;
  direction: 'enviada' | 'recebida';
  valid: boolean;
}
export type Telemetry =
  | { kind: 'temperature'; value: number }
  | { kind: 'humidity'; value: number }
  | { kind: 'lamp'; value: LampState };
