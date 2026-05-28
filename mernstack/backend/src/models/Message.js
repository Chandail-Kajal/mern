import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:     { type: String, default: "" },
    fileUrl:      { type: String, default: "" },
    fileName:     { type: String, default: "" },
    fileSize:     { type: Number, default: 0 },
    fileMimeType: { type: String, default: "" },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "gif", "sticker"],
      default: "text",
    },
    stickerData: { type: String, default: "" },
    read:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;