import RegulationChunk from "../models/RegulationChunk.js";
import { createEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

export const retrieveRules = async (queryText, category = "general") => {
  try {
    if (!queryText || queryText.trim().length === 0) {
      console.warn("Empty queryText received in retrieveRules");
      return [];
    }

    const queryEmbedding = await createEmbedding(queryText);

    // ✅ Filter by category if your RegulationChunk has a category field
    // If not, we fall back to all chunks
    let chunks;
    if (category && category !== "general") {
      chunks = await RegulationChunk.find({ category });
      console.log(`🔍 CHUNKS FOUND for category '${category}':`, chunks.length);

      // Fallback to all chunks if none found for category
      if (!chunks || chunks.length === 0) {
        console.warn(`⚠️ No chunks for category '${category}', falling back to all`);
        chunks = await RegulationChunk.find();
      }
    } else {
      chunks = await RegulationChunk.find();
    }

    console.log("🔍 CHUNKS FOUND:", chunks.length);

    if (!chunks || chunks.length === 0) {
      console.warn("⚠️ No chunks found in DB");
      return [];
    }

    const scored = chunks
      .map((chunk) => {
        if (!chunk.embedding || chunk.embedding.length === 0) return null;
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        return { ...chunk.toObject(), score: isNaN(score) ? 0 : score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log("✅ TOP RESULTS:", scored.length);
    return scored;

  } catch (error) {
    console.error("❌ retrieveRules error:", error);
    return [];
  }
};