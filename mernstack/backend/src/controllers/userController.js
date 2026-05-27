import User from "../models/User.js";

// @desc Update profile
// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get user by ID
// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Search users by username
// GET /api/users/search?name=xyz
export const searchUsers = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user._id },
      name: { $regex: name, $options: "i" }
    }).select("name avatar bio sentRequests receivedRequests followers following");

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Search error" });
  }
};

// @desc Send a chat request
// POST /api/users/:id/request
export const sendChatRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (currentUser.following.includes(targetUser._id)) {
      return res.status(400).json({ message: "You are already connected!" });
    }
    if (currentUser.sentRequests.includes(targetUser._id)) {
      return res.status(400).json({ message: "Request already sent ✨" });
    }

    currentUser.sentRequests.push(targetUser._id);
    targetUser.receivedRequests.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Cute chat request sent! Wait for them to accept 🌸" });
  } catch (error) {
    console.error("Send chat request error:", error);
    res.status(500).json({ message: "Server error sending request" });
  }
};

// @desc Accept a chat request
// POST /api/users/:id/accept
// @desc Accept a chat request & send automatic welcome message
// POST /api/users/:id/accept
export const acceptChatRequest = async (req, res) => {
  try {
    const senderUser = await User.findById(req.params.id); // Person who sent request
    const currentUser = await User.findById(req.user._id);  // You (the one accepting)

    if (!senderUser) return res.status(404).json({ message: "User not found" });

    // 1. Remove from pending arrays
    currentUser.receivedRequests = currentUser.receivedRequests.filter(id => id.toString() !== senderUser._id.toString());
    senderUser.sentRequests = senderUser.sentRequests.filter(id => id.toString() !== currentUser._id.toString());

    // 2. Establish mutual friendship connections (Friend list visibility)
    if (!currentUser.following.includes(senderUser._id)) currentUser.following.push(senderUser._id);
    if (!currentUser.followers.includes(senderUser._id)) currentUser.followers.push(senderUser._id);
    if (!senderUser.following.includes(currentUser._id)) senderUser.following.push(currentUser._id);
    if (!senderUser.followers.includes(currentUser._id)) senderUser.followers.push(currentUser._id);

    await currentUser.save();
    await senderUser.save();

    // 3. CREATE AUTOMATIC ENCRYPTED WELCOME MESSAGE
    // Simple Base64-style mock encryption string for "Match made! Let's chat here ✨🌸"
    // (Or use a custom AES string if you have a secret key setup)
    const systemText = "Match made! Let's chat here ✨🌸";
    const encryptedText = Buffer.from(systemText).toString('base64'); 

    await Message.create({
      sender: currentUser._id,
      receiver: senderUser._id,
      text: encryptedText, // Saves encrypted text to the database
      isEncrypted: true    // Flagger property
    });

    res.json({ 
      message: "Connection accepted! Start your cute conversations 💬✨",
      friend: {
        _id: senderUser._id,
        name: senderUser.name,
        avatar: senderUser.avatar
      }
    });
  } catch (error) {
    console.error("Accept chat request error:", error);
    res.status(500).json({ message: "Server error accepting request" });
  }
};

// @desc Get all connected users for chat list
// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $in: req.user.following }
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};