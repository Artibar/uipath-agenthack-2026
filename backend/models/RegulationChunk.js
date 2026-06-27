import mongoose from "mongoose";

const regulationChunkSchema = new mongoose.Schema(
  {
    regulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Regulation",
      required: true
    },
    title: String,
    chunkText: String,
    embedding: [Number],
    chunkIndex: Number,
    // ✅ ADD THIS
    category: {
      type: String,
      enum: ["vendor", "insurance", "loan", "general"],
      default: "general"
    }
  },
  { timestamps: true }
);

const RegulationChunk =
  mongoose.models.RegulationChunk ||
  mongoose.model("RegulationChunk", regulationChunkSchema);

export default RegulationChunk;