# Testes e roteiro de avaliação

## Verificação automatizada

Instale com `npm ci` e execute:

```bash
npm run typecheck
npm test
```

Os testes cobrem mensagens inválidas, faixas dos sensores, URLs WS/WSS, histórico de 10 mensagens, tendências de 24 amostras, busca/filtros, callbacks de conexões antigas, publicação antes de SUBACK, cancelamento, reconexão e timeouts.

Para a integração MQTT:

```bash
# Terminal 1
npm run broker

# Terminal 2
npm run test:mqtt
```

Esse teste usa um prefixo temporário e dois clientes reais, evitando interferência com os tópicos da demonstração.

## Teste completo da interface

```bash
# Terminal 1
npm run broker

# Terminal 2
npx expo export --platform all
npx serve dist -l 8082

# Terminal 3
npx playwright install chromium
npm run screenshots
```

**Não inicie outro simulador durante o teste de interface.** O script de screenshots controla seu próprio dispositivo, parando-o e reiniciando-o para testar ausência de confirmação e leituras antigas.

O script exercita o app real no Chromium com MQTT por WebSocket e gera as capturas em `docs/screenshots/`. Ele verifica:

1. Comando offline com aviso.
2. URL MQTT TCP recusada.
3. Broker conectado sem confirmação artificial de dispositivo.
4. Comando sem simulador: estado não muda e o timeout é informado.
5. Leituras reais chegando e tendências preenchidas.
6. ON/OFF confirmado por mensagem de estado.
7. Payload inválido sem substituir a temperatura.
8. Filtros de mensagens, busca e estado vazio.
9. Telemetria antiga com broker ainda conectado.
10. Queda real do WebSocket e reconexão automática.
11. Trocas de tela e reconexões manuais.
12. Light/Dark e recuperação da URL/tema após recarregar.
13. Viewport de 320 px sem vazamento horizontal.
14. Ausência de erros de runtime no navegador.

A automação do repositório executa esse procedimento em Linux/Node 22. Consulte [Actions](https://github.com/enzoalmeiida/iot-control-cp3/actions) para ver o resultado de cada execução.

## Roteiro manual para o professor

1. Inicie `npm run simulator` e `npm start` em terminais diferentes.
2. Abra o app e conecte ao broker padrão.
3. Verifique o status, temperatura, umidade e horário.
4. Aguarde algumas leituras para observar as tendências.
5. Ligue e desligue a lâmpada; compare o terminal do simulador com a confirmação no app.
6. Abra Histórico, consulte as direções e experimente filtros e busca.
7. Mude o tema e reinicie o app para verificar AsyncStorage.
8. Desconecte e tente um comando: deve aparecer um aviso.
9. Reconecte, pare o simulador e envie um comando: após 8 segundos, deve aparecer falta de confirmação.
10. Após 10 segundos sem telemetria, os sensores devem indicar leitura antiga.
11. Reinicie o simulador e observe a recuperação das leituras.
12. Em Configurações, confira o identificador dos tópicos e os integrantes.

## Correspondência com o enunciado

| Critério do CP | Onde conferir |
| --- | --- |
| Conexão, desconexão, status e erros | Dashboard / Configurações + testes do serviço |
| Sensores em tempo real | Dashboard + integração MQTT |
| ON/OFF com confirmação recebida | Lâmpada + teste MQTT + interface sem simulador |
| 10 mensagens recentes | Histórico + teste do limite |
| AsyncStorage e temas | Configurações + teste de recarga |
| Simulação reproduzível | scripts/device.ts, simulator.ts e broker.mjs |
| TypeScript, hooks e limpeza | typecheck + serviço/context + testes de callbacks antigos |
| Interface e navegação | Três telas + capturas e teste em 320 px |
| Identificação do grupo | README e Configurações |

## Limites da validação

Exportar os bundles Android/iOS confirma a preparação do JavaScript para essas plataformas; não gera um APK/IPA e não substitui a execução em aparelho físico. A validação automatizada interativa usa o alvo Web. O broker público não participa do CI: o broker local torna os testes reproduzíveis.
