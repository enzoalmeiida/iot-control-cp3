import assert from 'node:assert/strict';
import mqtt from 'mqtt';
import { startDevice } from './device';

async function run() {
const url = process.env.MQTT_URL ?? 'ws://localhost:8080/mqtt';
const prefix = 'fiap/teste/cp3-' + Date.now().toString(36);
const device = startDevice(url, prefix);
const app = mqtt.connect(url, { clean: true, reconnectPeriod: 0, connectTimeout: 8000 });
const timeout = setTimeout(() => {
  console.error('Tempo esgotado no teste MQTT.');
  cleanup(); process.exitCode = 1;
}, 15000);
let receivedTemperature = false;
let receivedHumidity = false;
let onConfirmed = false;
function cleanup() { clearTimeout(timeout); app.end(true); device.stop(); }
try {
  await device.ready;
  await new Promise<void>((resolve, reject) => {
    app.on('error', reject);
    const subscribe = () => app.subscribe([device.topics.temperature, device.topics.humidity, device.topics.lamp], error => {
      if (error) reject(error); else resolve();
    });
    if (app.connected) subscribe(); else app.once('connect', subscribe);
  });
  await new Promise<void>((resolve, reject) => {
    const send = (action: 'ON' | 'OFF') => app.publish(device.topics.command, JSON.stringify({ action }), { retain: false }, error => {
      if (error) reject(error);
    });
    app.on('message', (topic, bytes) => {
      try {
        const payload: unknown = JSON.parse(bytes.toString());
        assert.ok(typeof payload === 'object' && payload !== null);
        if (topic === device.topics.temperature) {
          assert.ok('value' in payload); assert.equal(typeof payload.value, 'number'); receivedTemperature = true;
        }
        if (topic === device.topics.humidity) {
          assert.ok('value' in payload); assert.equal(typeof payload.value, 'number'); receivedHumidity = true;
        }
        if (topic === device.topics.lamp && 'state' in payload) {
          if (payload.state === 'ON') { onConfirmed = true; send('OFF'); }
          else if (payload.state === 'OFF' && onConfirmed && receivedTemperature && receivedHumidity) resolve();
        }
      } catch (error) { reject(error); }
    });
    send('ON');
  });
  console.log('PASS: temperatura, umidade, comando ON + confirmação, comando OFF + confirmação.');
} catch (error) {
  console.error(error); process.exitCode = 1;
} finally { cleanup(); }

}
void run().catch(error => { console.error(error); process.exitCode = 1; });
