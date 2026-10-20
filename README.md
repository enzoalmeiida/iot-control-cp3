# IoT Control · Checkpoint 3

Aplicativo de monitoramento e controle de um ambiente inteligente, desenvolvido com **React Native, Expo e TypeScript**. Recebe temperatura e umidade por MQTT, envia comandos para uma lâmpada virtual e só altera seu estado visual após receber a confirmação do dispositivo.

## Integrantes

| Nome completo informado | RM |
| --- | --- |
| Enzo Almeida | RM556900 |
| Gabriel de Mello | RM554421 |
| Guilherme Moreira | RM557290 |

**Turma:** 3ESPV · Mobile Development & IoT · Segundo semestre.

## Funcionalidades

- **Dashboard:** estado da conexão, leituras com horário, ligar/desligar e confirmação recebida da lâmpada.
- **Histórico:** últimas 10 mensagens da sessão, com tópico, payload, horário e direção; mensagens inválidas são identificadas.
- **Configurações:** URL WebSocket, conectar/desconectar e tema Light/Dark.
- URL e tema persistidos com AsyncStorage e recuperados antes de liberar a interface.
- Reconexão a cada 3 segundos, timeout de conexão de 10 segundos e feedback para falhas.
- Mensagens validadas: JSON, tipos, temperatura entre −50 e 150 °C e umidade entre 0 e 100%.
- Comandos offline geram aviso; não são enfileirados para envio após reconectar.
- Aguarda até 8 segundos pela confirmação. Se ela não chegar, avisa e preserva o estado recebido.
- Um serviço MQTT por montagem do provider; inscrições e listeners são encerrados na desconexão/desmontagem.

## Tecnologias e versões

| Tecnologia | Versão configurada |
| --- | --- |
| Node.js | 20.19.4 ou superior; CI usa 22 |
| Expo | SDK 54 (`~54.0.0`) |
| React Native | 0.81.5 |
| React / React DOM | 19.1.0 |
| TypeScript | ~5.9.2 |
| MQTT.js | ^5.10.4 |
| AsyncStorage | 2.2.0 |
| React Native Web | ^0.21.0 |
| Safe Area Context | ~5.6.0 |

A biblioteca MQTT usa o bundle ESM de navegador no app, com WebSocket nativo e sem módulos TCP do Node. O simulador usa a entrada Node da mesma biblioteca. Não exige hardware, módulo nativo MQTT ou credenciais.

A primeira execução bem-sucedida da automação adiciona o `package-lock.json` com as versões exatas resolvidas. Depois dele, prefira `npm ci`.

## Instalação e execução

Pré-requisitos: Git, Node.js compatível e npm.

```bash
git clone https://github.com/enzoalmeiida/iot-control-cp3.git
cd iot-control-cp3
npm install
npm start
```

No terminal do Expo, pressione **a** para Android ou **w** para Web. Também há `npm run android`, `npm run ios` e `npm run web`.

Para celular físico, use uma versão do Expo Go compatível com SDK 54 e mantenha o computador acessível ao aparelho. Consulte [Expo Go](https://expo.dev/go). Se a versão instalada não aceitar SDK 54, use um development build compatível; no iOS o simulador exige macOS/Xcode. O app foi preparado para Android, iOS e Web; a automação exercita o alvo Web. Validação em aparelho físico deve ser realizada pelo grupo.

Se o Expo indicar divergência de dependências, execute `npx expo install --fix` e `npx expo-doctor`. Para limpar cache: `npx expo start --clear`.

## Broker padrão: WebSocket seguro

```text
wss://test.mosquitto.org:8081/mqtt
```

- Host: `test.mosquitto.org`.
- Porta: **8081**, MQTT sobre WebSocket com TLS (**WSS**).
- Caminho: `/mqtt`.
- Sem usuário e senha.
- **1883** é MQTT TCP; **8883** é MQTT TCP/TLS. Não são as portas usadas pelo app.
- O broker público pode ficar indisponível. Em Configurações, informe outro endpoint WS/WSS compatível e use o mesmo endereço no simulador.
- Broker público de testes: não publique dados privados. WSS é adequado também ao app servido via HTTPS.

Referência do broker: [test.mosquitto.org](https://test.mosquitto.org/).

## Tópicos e payloads

Prefixo exclusivo do grupo: `fiap/3espv/rm556900-rm554421-rm557290`.

| Sufixo após o prefixo | Direção no app | Payload |
| --- | --- | --- |
| `/sensor/temperatura` | Recebida / Subscribe | `{"value":24.5}` |
| `/sensor/umidade` | Recebida / Subscribe | `{"value":58}` |
| `/lampada/comando` | Enviada / Publish | `{"action":"ON"}` ou `{"action":"OFF"}` |
| `/lampada/estado` | Recebida / Subscribe | `{"state":"ON"}` ou `{"state":"OFF"}` |

Exemplo completo de comando: `fiap/3espv/rm556900-rm554421-rm557290/lampada/comando`.

O app assina sensores/estado com QoS 1. O simulador publica telemetria com QoS 0 a cada 2 segundos. Os comandos usam QoS 0, `retain: false` e fila offline desativada: não há entrega garantida; a confirmação de aplicação vem exclusivamente do tópico de estado. A sessão é limpa. O simulador ignora comandos retidos e não retém seu estado, que é reapresentado periodicamente.

## Simulador sem hardware

Em **outro terminal**, dentro da pasta do projeto:

```bash
npm run simulator
```

Ele se conecta ao broker padrão, gera leituras com variação suave, inicia a lâmpada em OFF, recebe comandos e publica o novo estado imediatamente. Ctrl+C encerra a conexão e o timer.

Para outro broker:

```bash
npm run simulator -- --url ws://localhost:8080/mqtt
```

Use o mesmo endereço nas Configurações do app. No celular físico, substitua `localhost` pelo IP do computador na rede, por exemplo `ws://192.168.0.10:8080/mqtt`.

### Alternativa local reproduzível

Sem depender do broker público, abra três terminais:

```bash
# Terminal 1: broker MQTT com listener WebSocket
npm run broker

# Terminal 2: dispositivo virtual
npm run simulator -- --url ws://localhost:8080/mqtt

# Terminal 3: app
npm run web
```

Configure o app com `ws://localhost:8080/mqtt` e conecte. O broker de desenvolvimento escuta na porta 8080 em todas as interfaces para permitir acesso pela rede local. Em redes restritas, libere essa porta; em produção, configure autenticação e WSS.

## Roteiro de demonstração

1. Inicie o simulador e abra o app.
2. Em Configurações, confirme a URL e toque em **Conectar**.
3. No Dashboard, aguarde **Conectado** e as leituras com horário.
4. Toque em **Ligar**: observe o comando no terminal do simulador e o estado **Ligada** confirmado no app.
5. Toque em **Desligar** e observe a confirmação **Desligada**.
6. Abra Histórico e confira tópico, conteúdo, horário e direção das últimas 10 mensagens.
7. Alterne Light/Dark; recarregue/reabra o app e confirme que tema e URL foram recuperados.
8. Desconecte e tente enviar um comando: o app informa que é necessário conectar.
9. Para verificar falta de confirmação, encerre o simulador, mantenha o app conectado e envie um comando. Após 8 segundos aparece o aviso.
10. Para verificar reconexão, interrompa o broker local ou a rede e restaure a conexão.

A conexão é iniciada pelo usuário; não é automática após reiniciar. Valores anteriores permanecem identificados como leituras sem conexão após desconectar e são limpos ao iniciar uma nova conexão.

## Prints das telas

As imagens abaixo são **capturas reais da versão Web em viewport de celular**, geradas por Playwright contra um broker MQTT local e o simulador do projeto. A automação salva os PNGs após os testes de interface e adiciona-os ao repositório. Enquanto a primeira execução estiver em andamento, eles ainda podem não aparecer.

| Dashboard Dark | Dashboard Light |
| --- | --- |
| ![Dashboard Dark](docs/screenshots/dashboard-dark.png) | ![Dashboard Light](docs/screenshots/dashboard-light.png) |

| Histórico Dark | Configurações Light |
| --- | --- |
| ![Histórico Dark](docs/screenshots/historico-dark.png) | ![Configurações Light](docs/screenshots/configuracoes-light.png) |

## Verificações

```bash
npm run typecheck
npm test

# Com npm run broker aberto em outro terminal:
npm run test:mqtt
```

- Testes de protocolo cobrem JSON inválido, tipos incorretos, faixas dos sensores, validação da URL e limite do histórico.
- O teste MQTT usa um prefixo temporário e dois clientes reais para validar sensores e ON/OFF com confirmação.
- GitHub Actions executa os testes, exporta a versão Web e usa Playwright para testar comandos, retorno de estado, rejeição de payload inválido, preferência de tema/URL e captura de telas.
- Consulte a execução e os logs na aba [Actions](https://github.com/enzoalmeiida/iot-control-cp3/actions). Os resultados efetivos são os exibidos nessa aba; a presença dos scripts não equivale a uma execução aprovada.

## Organização

```text
App.tsx                   Navegação por abas e estrutura visual
src/
  config.ts               Broker, tópicos e identificação do grupo
  components/             Cartões, botões, status e mensagens
  context/IoTContext.tsx   Estado, hooks e coordenação do app
  screens/                Dashboard, Histórico e Configurações
  services/               MQTT e AsyncStorage
  themes/                 Paletas Light/Dark
  types/                  Modelos TypeScript
  utils/protocol.ts       Validação de mensagens e URLs
scripts/                  Broker local, simulador e verificações
tests/                    Testes automatizados do protocolo
docs/screenshots/         Capturas reais geradas pela automação
.github/workflows/        Pipeline de testes e prints
```

## Limitações e entrega

O histórico é mantido em memória durante a sessão, conforme o enunciado. O simulador reinicia em OFF ao ser reiniciado. Não há execução MQTT garantida em segundo plano; ao voltar ao app, a conexão pode precisar ser refeita. As credenciais de brokers privados não são suportadas nesta entrega e não devem ser colocadas na URL.

Entregar **somente o link deste repositório no Microsoft Teams**. O enunciado não exige vídeo nem apresentação.

[Enunciado original](https://github.com/anderltda/doc-react-native/blob/main/CPS/3ESPV/Segundo%20Semestre/README_TRABALHO_REACT_NATIVE_MQTT.md)
