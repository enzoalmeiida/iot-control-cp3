import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import mqtt from 'mqtt';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const url = process.env.APP_URL ?? 'http://localhost:8082';
const brokerUrl = process.env.MQTT_URL ?? 'ws://localhost:8080/mqtt';
const prefix = 'fiap/3espv/rm556900-rm554421-rm557290';
const output = 'docs/screenshots';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 1380 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  const NativeWebSocket = window.WebSocket;
  window.__mqttSockets = [];
  window.WebSocket = class extends NativeWebSocket {
    constructor(...args) { super(...args); window.__mqttSockets.push(this); }
  };
});
const client = mqtt.connect(brokerUrl, { reconnectPeriod: 0 });
client.on('error', error => errors.push(error.message));
let simulator;
async function startSimulator() {
  simulator = spawn(process.execPath, ['--import', 'tsx', 'scripts/simulator.ts'], {
    env: { ...process.env, MQTT_URL: brokerUrl }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const processRef = simulator;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('O simulador não iniciou.')), 10000);
    processRef.stdout.on('data', chunk => {
      if (chunk.toString().includes('Conectado.')) { clearTimeout(timer); resolve(); }
    });
    processRef.once('error', error => { clearTimeout(timer); reject(error); });
    processRef.once('exit', code => { clearTimeout(timer); if (code) reject(new Error('Simulador saiu com código ' + code)); });
  });
}
async function stopSimulator() {
  if (!simulator || simulator.exitCode !== null) return;
  const processRef = simulator;
  await new Promise(resolve => { processRef.once('exit', resolve); processRef.kill('SIGTERM'); });
  simulator = undefined;
}
async function tab(name) { await page.getByTestId('tab-' + name).click(); }
async function dismiss() { const button = page.getByTestId('dismiss-notice'); if (await button.count()) await button.click(); }
async function capture(name, height = 1380) {
  await dismiss();
  await page.setViewportSize({ width: 390, height });
  await page.getByTestId('screen-scroll').evaluate(element => element.scrollTo(0, 0));
  await page.screenshot({ path: output + '/' + name + '.png', fullPage: true });
}
async function publish(topic, payload) {
  await new Promise((resolve, reject) => client.publish(prefix + topic, payload, { retain: false }, error => error ? reject(error) : resolve()));
}
await mkdir(output, { recursive: true });
try {
  await page.goto(url);
  await page.getByTestId('lamp-on').waitFor();
  await capture('boas-vindas-dark');
  await page.getByTestId('lamp-on').click();
  await page.getByText('Conecte ao broker antes de enviar comandos.', { exact: true }).waitFor();
  await tab('Configurações');
  await page.getByTestId('broker-url').fill('mqtt://localhost:1883');
  await page.getByRole('button', { name: 'Salvar endereço', exact: true }).click();
  await page.getByTestId('broker-validation').waitFor();
  await page.getByTestId('broker-url').fill(brokerUrl);
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await page.getByTestId('connection-status').getByText('Conectado', { exact: true }).waitFor();
  await tab('Dashboard');
  // Broker conectado não é confirmação de dispositivo, e clicar não muda o estado.
  assert.equal(await page.getByTestId('lamp-state').innerText(), 'Aguardando estado');
  await page.getByTestId('lamp-on').click();
  assert.equal(await page.getByTestId('lamp-state').innerText(), 'Aguardando estado');
  assert.equal(await page.getByTestId('lamp-off').isDisabled(), true);
  await page.getByText(/Sem confirmação em 8 segundos/).waitFor();
  assert.equal(await page.getByTestId('lamp-state').innerText(), 'Aguardando estado');
  await startSimulator();
  await page.getByText('Dispositivo online', { exact: true }).waitFor();
  await page.getByText(/Aguardando mais leituras/).first().waitFor({ state: 'hidden' });
  await page.getByTestId('lamp-on').click();
  await page.getByText('Ligada', { exact: true }).waitFor();
  await capture('dashboard-dark');
  await page.getByTestId('lamp-off').click();
  await page.getByText('Desligada', { exact: true }).waitFor();
  await stopSimulator();
  const previousTemperature = await page.getByTestId('temperature-value').innerText();
  await publish('/sensor/temperatura', '{"value":"invalido"}');
  await page.getByText('Mensagem inválida ignorada. Consulte o histórico.', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('temperature-value').innerText(), previousTemperature);
  await tab('Histórico');
  assert.equal(await page.getByTestId('message-entry').count() <= 10, true);
  await page.getByTestId('filter-Enviadas').click();
  assert.equal(await page.getByTestId('message-entry').count() >= 1, true);
  await page.getByTestId('filter-Inválidas').click();
  assert.equal(await page.getByTestId('message-entry').count(), 1);
  await page.getByTestId('history-search').fill('nenhum-resultado-aqui');
  await page.getByText('Nenhuma mensagem encontrada', { exact: true }).waitFor();
  await page.getByTestId('history-search').fill('');
  await page.getByTestId('filter-Todas').click();
  await capture('historico-dark', 1500);
  await tab('Dashboard');
  await page.getByTestId('lamp-on').click();
  assert.equal(await page.getByTestId('lamp-state').innerText(), 'Desligada');
  await page.getByText(/Sem confirmação em 8 segundos/).waitFor();
  assert.equal(await page.getByTestId('lamp-state').innerText(), 'Desligada');
  await page.getByText('Leitura antiga', { exact: true }).first().waitFor();
  // Encerra o socket real. O cliente deve refazer conexão e inscrições automaticamente.
  await page.evaluate(() => { for (const socket of window.__mqttSockets) if (socket.readyState === 1) socket.close(); });
  await page.getByTestId('connection-detail').waitFor();
  await page.getByTestId('connection-status').getByText('Conectado', { exact: true }).waitFor({ timeout: 20000 });
  await startSimulator();
  await page.getByText('Dispositivo online', { exact: true }).waitFor();
  // Trocar de tela e reconectar não deve acumular inscrições nem callbacks.
  for (let i = 0; i < 2; i++) {
    await tab('Configurações');
    await page.getByRole('button', { name: 'Reconectar', exact: true }).click();
    await page.getByTestId('connection-status').getByText('Conectado', { exact: true }).waitFor();
    await tab('Dashboard');
    await page.getByText('Dispositivo online', { exact: true }).waitFor();
  }
  await tab('Configurações');
  await page.getByTestId('theme-toggle').click();
  await page.getByText('Tema Light', { exact: true }).waitFor();
  await capture('configuracoes-light', 1900);
  await page.getByRole('button', { name: 'Consultar tópicos MQTT', exact: true }).click();
  await page.getByTestId('topic-reference').waitFor();
  await tab('Dashboard');
  await capture('dashboard-light');
  await page.setViewportSize({ width: 1440, height: 1060 });
  await page.getByTestId('screen-scroll').evaluate(element => element.scrollTo(0, 0));
  await page.screenshot({ path: output + '/dashboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  try {
    await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth, null, { timeout: 5000 });
  } catch {
    const overflow = await page.evaluate(() => [...document.querySelectorAll('*')].map(element => ({
      tag: element.tagName, text: element.textContent?.slice(0, 70),
      left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right,
    })).filter(item => item.right > window.innerWidth + 1).slice(-15));
    throw new Error('Layout excede 320 px: ' + JSON.stringify(overflow));
  }
  await tab('Configurações');
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await page.getByTestId('connection-status').getByText('Desconectado', { exact: true }).waitFor();
  await page.reload();
  await tab('Configurações');
  await page.getByText('Tema Light', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('broker-url').inputValue(), brokerUrl);
  assert.deepEqual(errors, []);
  console.log('PASS: interface responsiva, MQTT real, ON/OFF, ausência de confirmação, frescor dos sensores, reconexão, filtros, URL e tema persistidos.');
} finally { await stopSimulator(); client.end(true); await browser.close(); }
