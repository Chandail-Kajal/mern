import express from "express";
import { 
  updateProfile, 
  getUserById, 
  getAllUsers,
  searchUsers,       // Added safely
  sendChatRequest,   // Added safely
  acceptChatRequest  // Added safely
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Base profile & directory routes
router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

// Connection state invitation routes
router.post("/:id/request", protect, sendChatRequest);
router.post("/:id/accept", protect, acceptChatRequest);

export default router;