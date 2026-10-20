import { DEFAULT_BROKER } from '../src/config';
import { startDevice } from './device';

const argument = process.argv.indexOf('--url');
const url = (argument >= 0 ? process.argv[argument + 1] : process.env.MQTT_URL) ?? DEFAULT_BROKER;
const device = startDevice(url);
console.log('IoT Control · simulador · broker:', url);
device.ready.catch(() => { device.stop(); process.exitCode = 1; });
process.once('SIGINT', () => { device.stop(); process.exit(0); });
process.once('SIGTERM', () => { device.stop(); process.exit(0); });
