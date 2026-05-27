import Message from "../models/Message.js";

// @desc Get messages between two users
// GET /api/messages/:userId
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Send a message
// POST /api/messages/:userId
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    if (!text && !image) {
      return res.status(400).json({ message: "Message must have text or image" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: req.params.userId,
      text: text || "",
      image,
    });

    await message.populate("sender", "name avatar");
    await message.populate("receiver", "name avatar");

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
