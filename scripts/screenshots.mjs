import { chromium } from 'playwright';
import mqtt from 'mqtt';
import { mkdir } from 'node:fs/promises';

const url = process.env.APP_URL ?? 'http://localhost:8082';
const brokerUrl = process.env.MQTT_URL ?? 'ws://localhost:8080/mqtt';
const prefix = 'fiap/3espv/rm556900-rm554421-rm557290';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const client = mqtt.connect(brokerUrl, { reconnectPeriod: 0 });
const output = 'docs/screenshots';
await mkdir(output, { recursive: true });
try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Ligar', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ligar', exact: true }).click();
  await page.getByText('Conecte ao broker antes de enviar comandos.', { exact: true }).waitFor();
  await page.getByTestId('tab-Configurações').click();
  await page.getByTestId('broker-url').fill(brokerUrl);
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await page.getByText('Conectado', { exact: true }).waitFor({ timeout: 20000 });
  await page.getByTestId('tab-Dashboard').click();
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-testid="temperature-value"]');
    const h = document.querySelector('[data-testid="humidity-value"]');
    return t?.textContent !== '—' && h?.textContent !== '—';
  });
  await page.getByRole('button', { name: 'Ligar', exact: true }).click();
  await page.getByText('Ligada', { exact: true }).waitFor();
  await page.screenshot({ path: output + '/dashboard-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Desligar', exact: true }).click();
  await page.getByText('Desligada', { exact: true }).waitFor();
  // Publica mensagem inválida de um segundo cliente; a interface continua funcionando.
  await new Promise((resolve, reject) => client.publish(prefix + '/sensor/temperatura', '{"value":"invalido"}', error => error ? reject(error) : resolve()));
  await page.getByText('Mensagem inválida ignorada. Consulte o histórico.', { exact: true }).waitFor();
  await page.getByTestId('tab-Histórico').click();
  await page.getByText('Payload inválido · não aplicado aos sensores', { exact: true }).waitFor();
  await page.screenshot({ path: output + '/historico-dark.png', fullPage: true });
  await page.getByTestId('tab-Configurações').click();
  await page.getByTestId('theme-toggle').click();
  await page.getByText('Tema Light', { exact: true }).waitFor();
  await page.screenshot({ path: output + '/configuracoes-light.png', fullPage: true });
  await page.getByTestId('tab-Dashboard').click();
  await page.screenshot({ path: output + '/dashboard-light.png', fullPage: true });
  await page.getByTestId('tab-Configurações').click();
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await page.getByText('Desconectado', { exact: true }).waitFor();
  await page.reload();
  await page.getByTestId('tab-Configurações').click();
  await page.getByText('Tema Light', { exact: true }).waitFor();
  const persisted = await page.getByTestId('broker-url').inputValue();
  if (persisted !== brokerUrl) throw new Error('URL não foi recuperada do AsyncStorage.');
  if (errors.length) throw new Error('Erros de runtime: ' + errors.join('; '));
  console.log('PASS: interface Web, MQTT real, ON/OFF confirmado, payload inválido, temas, URL persistida e screenshots.');
} finally { client.end(true); await browser.close(); }
