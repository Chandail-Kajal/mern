import express from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Pure messaging endpoints
router.get("/:userId", protect, getMessages);
router.post("/:userId", protect, upload.single("image"), sendMessage);

export default router;