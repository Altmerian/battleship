import { httpServer } from "./http_server/index.js";
import { initWebSocketServer } from "./websocket_server/index";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on port ${HTTP_PORT}`);
const server = httpServer.listen(HTTP_PORT, () => {
  const wss = initWebSocketServer(WS_PORT);

  process.on("exit", (code: number) => {
    console.log(`Received ${code} code. Shutting down servers...`);
    wss.close((wsErr) => {
      if (wsErr) {
        console.error("Error closing WebSocket server:", wsErr);
      }
      console.log("WebSocket server closed.");
      server.close((httpErr) => {
        if (httpErr) {
          console.error("Error closing HTTP server:", httpErr);
        }
        console.log("HTTP server closed.");
        console.log("All servers closed. Exiting process.");
        process.exit(0);
      });
    });
  });
});
