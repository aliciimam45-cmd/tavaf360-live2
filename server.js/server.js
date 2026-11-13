
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import {
  TikTokLiveConnection,
  WebcastEvent
} from "tiktok-live-connector";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "sadakartt.com";

const clients = new Set();
const joinedUsers = new Set();

app.get("/", (req, res) => {
  res.send("Tavaf360 LIVE server is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

const connection = new TikTokLiveConnection(TIKTOK_USERNAME);

connection.on(WebcastEvent.CHAT, (data) => {
  const comment = (data.comment || "").trim().toLocaleUpperCase("tr-TR");
  const username = data.user?.uniqueId;

  if (!username || comment !== "KATIL") return;
  if (joinedUsers.has(username)) return;

  joinedUsers.add(username);

  broadcast({
    type: "JOIN",
    username: username
  });

  console.log("New participant:", username);
});

connection.on("error", (error) => {
  console.error("TikTok connection error:", error);
});

connection.connect()
  .then(() => console.log("TikTok LIVE connected!"))
  .catch((error) => console.error("Connection failed:", error));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Tavaf360 server running on port ${PORT}`);
});
