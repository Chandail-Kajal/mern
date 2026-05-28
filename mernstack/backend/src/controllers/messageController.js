import path from "path";
import Message from "../models/Message.js";
import { categorise } from "../middleware/uploadMiddleware.js";
 
// GET /api/messages/:userId
export const getMessages = async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate("sender",   "name avatar")
      .populate("receiver", "name avatar")
      .sort({ createdAt: 1 });
 
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );
 
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
 
// POST /api/messages/:userId   (text / sticker)
export const sendMessage = async (req, res) => {
  try {
    const { text, messageType = "text", fileUrl, stickerData } = req.body;
 
    if (!text && !fileUrl && !stickerData) {
      return res.status(400).json({ message: "Empty message" });
    }
 
    const message = await Message.create({
      sender:      req.user._id,
      receiver:    req.params.userId,
      text:        text        || "",
      fileUrl:     fileUrl     || "",
      stickerData: stickerData || "",
      messageType,
    });
 
    await message.populate("sender",   "name avatar");
    await message.populate("receiver", "name avatar");
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
 
// POST /api/messages/:userId/upload   (binary file)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file received" });
 
    const ext = path.extname(req.file.originalname).toLowerCase();
    const { type } = categorise(req.file.mimetype, ext);
 
    const subdir = ["image","gif"].includes(type) ? "images"
                 : type === "video" ? "videos"
                 : type === "audio" ? "audio"
                 : "files";
 
    const fileUrl = `/uploads/${subdir}/${req.file.filename}`;
 
    const message = await Message.create({
      sender:      req.user._id,
      receiver:    req.params.userId,
      fileUrl,
      fileName:     req.file.originalname,
      fileSize:     req.file.size,
      fileMimeType: req.file.mimetype,
      messageType:  type,
    });
 
    await message.populate("sender",   "name avatar");
    await message.populate("receiver", "name avatar");
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
 