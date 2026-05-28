import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes    from "./routes/authRoutes.js";
import userRoutes    from "./routes/userRoutes.js";
import postRoutes    from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import callRoutes    from "./routes/callRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app        = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST", "PATCH"] },
});

connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Serve ALL upload sub-folders: /uploads/images, /uploads/files, /uploads/audio, /uploads/videos, /uploads/stickers
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/posts",    postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls",    callRoutes);
app.get ("/api/health",  (_, res) => res.json({ status: "ok" }));

// ── Socket.IO ─────────────────────────────────────────────────────────────────
// Maps  userId → socketId  for routing events
const onlineUsers = new Map();

io.on("connection", (socket) => {
  // ── presence ────────────────────────────────────────────────────────────────
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("user:status", { userId, online: true });
  });

  // ── chat messages ────────────────────────────────────────────────────────────
  socket.on("message:send", (data) => {
    const receiverSocketId = onlineUsers.get(data.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message:receive", data);
    }
  });
  socket.on("message:edit", ({ messageId, receiver, newText }) => {
    socket.to(receiver).emit("message:receive", {
      action: "edit",
      messageId,
      newText
    });
  });

  socket.on("message:delete-everyone", ({ messageId, receiver }) => {
    socket.to(receiver).emit("message:receive", {
      action: "delete-everyone",
      messageId
    });
  });

  // ── WebRTC signalling  (call:offer → call:answer → call:ice-candidate) ───────
  // All three events forward a payload from one peer to the other.

  socket.on("call:offer", ({ to, from, offer, callType, callId, callerName, callerAvatar }) => {
    const toSocket = onlineUsers.get(to);
    if (toSocket) {
      io.to(toSocket).emit("call:incoming", { from, offer, callType, callId, callerName, callerAvatar });
    } else {
      // target offline → immediately mark missed
      socket.emit("call:missed", { callId });
    }
  });

  socket.on("call:answer", ({ to, answer, callId }) => {
    const toSocket = onlineUsers.get(to);
    if (toSocket) io.to(toSocket).emit("call:answered", { answer, callId });
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const toSocket = onlineUsers.get(to);
    if (toSocket) io.to(toSocket).emit("call:ice-candidate", { candidate });
  });

  socket.on("call:reject", ({ to, callId }) => {
    const toSocket = onlineUsers.get(to);
    if (toSocket) io.to(toSocket).emit("call:rejected", { callId });
  });

  socket.on("call:end", ({ to, callId }) => {
    const toSocket = onlineUsers.get(to);
    if (toSocket) io.to(toSocket).emit("call:ended", { callId });
  });

  // ── disconnect ───────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        io.emit("user:status", { userId, online: false });
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
