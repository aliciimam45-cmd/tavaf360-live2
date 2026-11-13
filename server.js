
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
const USERNAME = process.env.TIKTOK_USERNAME || "sadakartt.com";

const clients = new Set();
const joinedUsers = new Set();

app.get("/", (req, res) => {
  res.send("Tavaf360 LIVE is running!");
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

server.listen(PORT, "0.0.0.0", () => {
  console.log("Tavaf360 server running on port " + PORT);
});

const connection = new TikTokLiveConnection(USERNAME);

connection.on(WebcastEvent.CHAT, (data) => {
  const comment = (data.comment || "")
    .trim()
    .toLocaleUpperCase("tr-TR");

  const username = data.user?.uniqueId;

  if (comment !== "KATIL" || !username) return;
  if (joinedUsers.has(username)) return;

  joinedUsers.add(username);

  broadcast({
    type: "JOIN",
    username
  });

  console.log("Participant joined:", username);
});

connection.on("error", (error) => {
  console.error("TikTok error:", error);
});

connection.connect()
  .then(() => console.log("TikTok LIVE connected"))
  .catch((error) => console.error("TikTok connection failed:", error));
