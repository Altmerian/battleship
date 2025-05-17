import { httpServer } from "./http_server/index.js";
import { initWebSocketServer } from './websocket_server/index.js'; // .js extension for compatibility with current tsconfig/webpack setup

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
const server = httpServer.listen(HTTP_PORT, () => {
  const wss = initWebSocketServer(WS_PORT);

  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    wss.close((err) => {
      if (err) {
        console.error('Error closing WebSocket server:', err);
      }
      console.log('WebSocket server closed.');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    });
  });
});
