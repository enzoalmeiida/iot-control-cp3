// Broker somente para desenvolvimento/testes locais; não é necessário para usar o broker público.
import createAedes from 'aedes';
import { createServer } from 'node:http';
import { WebSocketServer, createWebSocketStream } from 'ws';
const broker = createAedes();
const server = createServer();
const sockets = new WebSocketServer({ server, path: '/mqtt' });
sockets.on('connection', socket => broker.handle(createWebSocketStream(socket)));
server.listen(8080, '0.0.0.0', () => console.log('Broker local: ws://localhost:8080/mqtt'));
async function stop() {
  for (const socket of sockets.clients) socket.terminate();
  sockets.close();
  server.close();
  broker.close();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
