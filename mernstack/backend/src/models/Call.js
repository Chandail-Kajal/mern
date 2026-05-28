import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    caller:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // audio | video
    callType: { type: String, enum: ["audio", "video"], required: true },

    // initiated | ringing | ongoing | ended | missed | rejected
    status: {
      type: String,
      enum: ["initiated", "ringing", "ongoing", "ended", "missed", "rejected"],
      default: "initiated",
    },

    startedAt:  { type: Date },
    endedAt:    { type: Date },
    durationSec:{ type: Number, default: 0 },  // seconds, calculated on end
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);
export default Call;
