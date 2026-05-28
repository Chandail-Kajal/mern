import express from "express";
import { saveCallLog, getCallHistory } from "../controllers/callController.js";

const router = express.Router();

router.post("/log", saveCallLog);
router.get("/history/:userId", getCallHistory);

export default router;