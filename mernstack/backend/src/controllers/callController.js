import Message from "../models/message.js"; // Ensure path matches your project structure

export const saveCallLog = async (req, res) => {
  try {
    const { sender, receiver, callStatus, callDuration } = req.body;

    const newCallLog = new Message({
      sender,
      receiver,
      messageType: "call",
      callStatus,      // "completed", "missed", "declined"
      callDuration,    // in seconds
    });

    await newCallLog.save();
    res.status(201).json({ success: true, data: newCallLog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    // Fetches all call logs involving this user
    const history = await Message.find({
      messageType: "call",
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};