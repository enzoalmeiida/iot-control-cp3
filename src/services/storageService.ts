import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_BROKER } from '../config';
import type { Preferences } from '../types/mqtt';
import { validateBrokerUrl } from '../utils/protocol';

const KEY = '@iot-control/preferences/v1';
export const defaultPreferences: Preferences = { brokerUrl: DEFAULT_BROKER, theme: 'dark' };

export async function loadPreferences(): Promise<Preferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaultPreferences;
  const data: unknown = JSON.parse(raw);
  if (typeof data !== 'object' || data === null || !('brokerUrl' in data) || !('theme' in data)
    || typeof data.brokerUrl !== 'string' || (data.theme !== 'light' && data.theme !== 'dark')) {
    throw new Error('Preferências inválidas. Os valores padrão foram carregados.');
  }
  return { brokerUrl: validateBrokerUrl(data.brokerUrl), theme: data.theme };
}

// Serializa as gravações para que toques rápidos não restaurem um tema antigo.
let writeQueue: Promise<void> = Promise.resolve();
export function savePreferences(preferences: Preferences): Promise<void> {
  const snapshot = JSON.stringify(preferences);
  const write = writeQueue.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, snapshot));
  writeQueue = write;
  return write;
}
