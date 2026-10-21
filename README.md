<p align="center"><img src="docs/banner.svg" alt="IoT Control — Seu ambiente. Mais inteligente." width="100%" /></p>

<p align="center">
  <a href="https://github.com/enzoalmeiida/iot-control-cp3/actions/workflows/verify.yml"><img src="https://github.com/enzoalmeiida/iot-control-cp3/actions/workflows/verify.yml/badge.svg" alt="Verificação automatizada" /></a>
  <img src="https://img.shields.io/badge/Expo-SDK%2054-111c2c?logo=expo" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/MQTT-WebSocket-087d64" alt="MQTT por WebSocket" />
</p>

# IoT Control · Checkpoint 3

Um painel para **acompanhar seu ambiente e controlar uma lâmpada virtual em tempo real**. Desenvolvido com React Native, Expo e TypeScript, com comunicação MQTT por WebSocket, simulador sem hardware e interface adaptada a celular e desktop.

> O botão envia um comando. **Quem confirma a mudança é o dispositivo.** O aplicativo nunca deduz o estado da lâmpada apenas a partir do toque.

## Integrantes

| Nome | RM |
| --- | --- |
| **Enzo Almeida** | **RM556900** |
| **Gabriel de Mello** | **RM554421** |
| **Guilherme Moreira** | **RM557290** |

**FIAP · 3ESPV · Mobile Development & IoT · Segundo semestre**

[Iniciar o projeto](#comece-em-poucos-passos) · [Telas](#conheça-as-telas) · [Tópicos MQTT](#contrato-de-mensagens) · [Testes](#qualidade-e-verificações) · [Arquitetura](docs/ARCHITECTURE.md)

## O que o aplicativo oferece

- **Dashboard:** temperatura, umidade, horários, gráficos das últimas 24 leituras, mínimos/máximos e controle confirmado da lâmpada.
- **Saúde do dispositivo:** diferencia conexão ao broker de telemetria ativa. Leituras sem atualização por mais de 10 segundos são marcadas como antigas.
- **Histórico:** as 10 mensagens mais recentes com direção, horário, tópico e JSON formatado; busca por conteúdo/tópico e filtros por direção ou validade.
- **Conexão resiliente:** reconexão automática, ação manual, cancelamento de tentativas, timeout de inscrição e cancelamento de envios pendentes.
- **Preferências:** endereço do broker e tema Light/Dark persistidos com AsyncStorage.
- **Interface:** ícones vetoriais, gráficos com dados recebidos, navegação acessível, estados vazios e avisos que podem ser fechados.
- **Simulação reproduzível:** dispositivo virtual e broker WebSocket local opcionais, incluídos no repositório.

## Comece em poucos passos

Pré-requisitos: **Node.js 20.19.4+** (recomendado: Node 22), npm e Git.

```bash
git clone https://github.com/enzoalmeiida/iot-control-cp3.git
cd iot-control-cp3
npm ci
```

**Terminal 1 — dispositivo simulado:**

```bash
npm run simulator
```

**Terminal 2 — aplicativo:**

```bash
npm start
```

Abra no Expo Go compatível, emulador ou navegador. No app, toque em **Conectar ambiente**, aguarde as leituras e experimente **Ligar** e **Desligar**.

| Comando | Uso |
| --- | --- |
| `npm start` | Abre o servidor de desenvolvimento Expo |
| `npm run android` | Abre em Android configurado |
| `npm run ios` | Abre no simulador iOS em macOS/Xcode |
| `npm run web` | Abre o alvo Web |
| `npm run simulator` | Inicia o dispositivo no broker público padrão |
| `npm run broker` | Inicia o broker WebSocket local |
| `npm run typecheck` | Confere os tipos TypeScript |
| `npm test` | Executa testes de protocolo, serviço, filtros e telemetria |
| `npm run test:mqtt` | Testa o ciclo MQTT contra um broker local aberto |

**Celular físico:** use uma versão do [Expo Go compatível com SDK 54](https://expo.dev/go) e mantenha o computador acessível ao aparelho. Se a versão disponível não aceitar SDK 54, use um development build compatível. A exportação Android/iOS e a execução Web são verificadas pela automação; o teste em dispositivo físico deve ser realizado pelo grupo.

## Conheça as telas

Os prints são **capturas reais do app Web em viewport de celular**, usando o broker e o simulador do projeto. A automação renova as imagens quando os testes passam.

| Dashboard · Dark | Dashboard · Light |
| --- | --- |
| <img src="docs/screenshots/dashboard-dark.png" width="340" alt="Dashboard Dark com leituras e lâmpada confirmada" /> | <img src="docs/screenshots/dashboard-light.png" width="340" alt="Dashboard Light com gráficos reais" /> |

| Histórico · Dark | Configurações · Light |
| --- | --- |
| <img src="docs/screenshots/historico-dark.png" width="340" alt="Histórico com tópicos, payloads, busca e filtros" /> | <img src="docs/screenshots/configuracoes-light.png" width="340" alt="Configurações do broker, tema, diagnóstico e integrantes" /> |

<details>
<summary>Ver layout desktop e primeiro acesso</summary>

![Dashboard no desktop](docs/screenshots/dashboard-desktop.png)

<img src="docs/screenshots/boas-vindas-dark.png" width="340" alt="Primeiro acesso com estados de espera e ação de conectar" />

</details>

### Dashboard

Gráficos e indicadores usam somente mensagens válidas efetivamente recebidas. Os gráficos acumulam até 24 amostras por sensor durante a conexão, sem inventar leituras no app. A lâmpada exibe o último estado recebido, identifica quando ele está antigo e aguarda até 8 segundos pela confirmação de um comando.

### Histórico

Guarda exatamente as últimas 10 mensagens recebidas/publicadas durante a sessão. Os filtros não apagam os registros. Os contadores de diagnóstico somam toda a sessão, portanto podem ser maiores que 10. Mensagens inválidas aparecem no histórico, mas não substituem os sensores.

### Configurações

Valida o endereço, salva a preferência, conecta/desconecta, oferece um preset público e alterna o tema. Há diagnóstico de reconexões, referência de tópicos e identificação do grupo. **Usar padrão** preenche o endereço; toque em Salvar ou Conectar para aplicá-lo.

## Broker padrão

```text
wss://test.mosquitto.org:8081/mqtt
```

| Campo | Valor |
| --- | --- |
| Host | `test.mosquitto.org` |
| Transporte | MQTT 3.1.1 sobre **WSS** |
| Porta | **8081** |
| Caminho | `/mqtt` |
| Autenticação | Sem usuário/senha |

**1883 e 8883 são portas MQTT TCP; não são as portas WebSocket usadas pelo app.**

O endereço pode ser alterado em Configurações. O simulador precisa usar o mesmo broker e os mesmos tópicos. O serviço público pode ficar indisponível; use a alternativa local para uma demonstração independente da internet. Não publique informações privadas em um broker público.

[Configuração publicada pelo Mosquitto](https://test.mosquitto.org/)

## Contrato de mensagens

Prefixo exclusivo: **`fiap/3espv/rm556900-rm554421-rm557290`**

| Tópico: prefixo + sufixo | Direção no app | Payload |
| --- | --- | --- |
| `/sensor/temperatura` | Subscribe | `{"value":24.5}` |
| `/sensor/umidade` | Subscribe | `{"value":58}` |
| `/lampada/comando` | Publish | `{"action":"ON"}` ou `{"action":"OFF"}` |
| `/lampada/estado` | Subscribe | `{"state":"ON"}` ou `{"state":"OFF"}` |

Exemplo completo: `fiap/3espv/rm556900-rm554421-rm557290/lampada/comando`.

- Sensores e estado são assinados com QoS 1.
- Comandos e telemetria são publicados com QoS 0, `retain: false`.
- A fila offline de comandos é desativada: comandos não ficam guardados para uma reconexão posterior.
- A confirmação de aplicação vem do tópico de estado; confirmação de envio não equivale a confirmação da lâmpada.
- Mensagens retidas podem ser exibidas como último estado, mas não confirmam um comando pendente.
- Temperatura aceita: −50 a 150 °C. Umidade: 0 a 100%. Exige JSON, número finito e ON/OFF em maiúsculas.
- Payloads maiores que 2.048 caracteres são rejeitados; o histórico limita sua exibição a esse tamanho.

## Teste sem depender do broker público

Abra três terminais na pasta do projeto:

```bash
# Terminal 1 — broker local
npm run broker

# Terminal 2 — dispositivo no mesmo broker
npm run simulator -- --url ws://localhost:8080/mqtt

# Terminal 3 — app Web
npm run web
```

Em Configurações, informe **`ws://localhost:8080/mqtt`** e toque em Conectar.

**No celular físico**, substitua `localhost` pelo IP do computador, por exemplo `ws://192.168.0.10:8080/mqtt`. O computador e o celular devem conseguir se comunicar pela rede. O broker local de desenvolvimento escuta na porta 8080 em todas as interfaces.

O simulador envia leituras a cada 2 segundos, inicia em OFF, confirma comandos imediatamente e ignora comandos retidos. Ctrl+C encerra o processo e seus timers. Os valores simulados variam de forma determinística; não representam medições físicas.

## Qualidade e verificações

A [automação do GitHub Actions](https://github.com/enzoalmeiida/iot-control-cp3/actions) executa:

1. Checagem TypeScript em modo strict.
2. Testes de protocolo, filtros, amostras e ciclo de vida da conexão.
3. Integração com broker real: sensores, comando ON/estado ON e comando OFF/estado OFF.
4. Exportação dos bundles **Android, iOS e Web**.
5. Testes da interface no Chromium: estado sem confirmação, payload inválido, dados antigos, queda do WebSocket, reconexão, filtros, persistência e layout estreito.
6. Capturas reais das telas, salvas no repositório após aprovação.

Para reproduzir os testes e os cenários de avaliação, veja [docs/TESTING.md](docs/TESTING.md).

## Tecnologias

| Tecnologia | Versão configurada |
| --- | --- |
| Expo | SDK 54 (`~54.0.0`) |
| React Native | 0.81.5 |
| React / React DOM | 19.1.0 |
| TypeScript | ~5.9.2 · strict |
| MQTT.js | ^5.10.4 |
| AsyncStorage | 2.2.0 |
| React Native SVG | 15.12.1 |
| React Native Web | ^0.21.0 |
| Safe Area Context | ~5.6.0 |
| Node no CI | 22 |

O `package-lock.json` fixa as versões resolvidas. O app usa o bundle ESM de navegador do MQTT.js para evitar módulos TCP do Node; o simulador usa sua entrada Node. Não há credenciais privadas no projeto.

## Organização

```text
App.tsx                   Estrutura, navegação e avisos
src/
  components/             Design visual, ícones, gráficos e cartões
  context/IoTContext.tsx   Estado, persistência e confirmação de comandos
  hooks/                  Atualização de indicadores de tempo
  screens/                Dashboard, Histórico e Configurações
  services/
    mqttService.ts        Ciclo de vida MQTT independente da interface
    mqttClient.ts         Adaptador MQTT.js / WebSocket
    storageService.ts     AsyncStorage com gravações serializadas
  themes/                 Paletas completas Light/Dark
  types/                  Modelos tipados
  utils/                  Validação, filtros e métricas
scripts/                  Simulador, broker e verificações
tests/                    Testes automatizados
docs/                     Arquitetura, roteiro e capturas
```

[Arquitetura e decisões técnicas](docs/ARCHITECTURE.md)

## Limitações e solução de problemas

- O histórico e as amostras são mantidos em memória durante a sessão/conexão; somente URL e tema são persistidos.
- O usuário inicia a conexão. Ao voltar do segundo plano, o app tenta restabelecer uma conexão solicitada que esteja indisponível.
- Não há garantia de execução MQTT em segundo plano nem de entrega QoS 0. O último estado é preservado quando falta confirmação.
- Ao reiniciar o simulador, a lâmpada volta a OFF.
- O app não implementa autenticação de brokers privados e rejeita credenciais/tokens na URL.
- Em páginas HTTPS, use WSS para evitar bloqueio de conteúdo misto.
- Se a porta WebSocket estiver bloqueada, teste o broker local e verifique a conectividade da rede.
- Para limpar cache do Expo: `npx expo start --clear`. Para conferir dependências: `npx expo-doctor`.
- As capturas demonstram a execução Web. Exportar os bundles nativos não substitui testar o app em um aparelho.

## Entrega

Envie **somente o link deste repositório no Microsoft Teams**, na tarefa do CP. O enunciado não exige vídeo ou apresentação.

[Enunciado original do professor](https://github.com/anderltda/doc-react-native/blob/main/CPS/3ESPV/Segundo%20Semestre/README_TRABALHO_REACT_NATIVE_MQTT.md)
