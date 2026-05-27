import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Socket.IO - Real-time chat
// Keep track of which user ID is connected to which socket ID
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✨ A user connected via WebSocket:", socket.id);

  // 1. Listen for user coming online
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} is now online with socket ${socket.id}`);
  });

  // 2. Listen for a live message sent from the frontend
  socket.on("message:send", (data) => {
    const { sender, receiver, text } = data;
    
    // Find the socket ID of the person receiving the message
    const receiverSocketId = onlineUsers.get(receiver);

    if (receiverSocketId) {
      // Send the message directly to the receiver's screen instantly!
      io.to(receiverSocketId).emit("message:receive", {
        sender,
        receiver,
        text,
        createdAt: new Date()
      });
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👋 User ${userId} went offline`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
