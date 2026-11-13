
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { WebcastPushConnection } from "tiktok-live-connector/legacy";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const tiktokUsername = (
  process.env.TIKTOK_USERNAME || "sadakartt.com"
).replace(/^@/, "");

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
  console.log("Simulation connected");

  ws.on("close", () => {
    clients.delete(ws);
  });
});

function sendToSimulation(payload) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("Tavaf360 server running on port " + PORT);
});

const tiktokLiveConnection = new WebcastPushConnection(
  tiktokUsername
);

tiktokLiveConnection.on("chat", (data) => {
  const message = (data.comment || "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (message !== "katıl" && message !== "katil") {
    return;
  }

  const username = data.uniqueId;
  if (!username || joinedUsers.has(username)) return;

  joinedUsers.add(username);

  console.log("New participant:", username);

  sendToSimulation({
    action: "JOIN_TAWAF",
    userId: data.userId,
    username: username,
    nickname: data.nickname || username,
    avatar: data.profilePictureUrl || ""
  });
});

tiktokLiveConnection.on("error", (error) => {
  console.error("TikTok connection error:", error);
});

tiktokLiveConnection.connect()
  .then((state) => {
    console.log("TikTok connected! Room ID:", state.roomId);
  })
  .catch((error) => {
    console.error("TikTok connection failed:", error);
  });
