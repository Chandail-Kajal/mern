import express from "express";
import { getMessages, sendMessage, uploadFile } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
 
const router = express.Router();
 
router.get   ("/:userId",         protect, getMessages);
router.post  ("/:userId",         protect, sendMessage);
router.post  ("/:userId/upload",  protect, upload.single("file"), uploadFile);
 
export default router;
 