import RegulationChunk from "../models/RegulationChunk.js";
import { createEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

export const retrieveRules = async (queryText) => {
  try {
    if (!queryText || queryText.trim().length === 0) {
      console.warn("Empty queryText received in retrieveRules");
      return [];
    }

    const queryEmbedding = await createEmbedding(queryText);

    const chunks = await RegulationChunk.find();

    console.log("🔍 CHUNKS FOUND:", chunks.length);

    if (!chunks || chunks.length === 0) {
      console.warn("⚠️ No chunks found in DB");
      return [];
    }

    const scored = chunks
      .map((chunk) => {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          return null;
        }

        const score = cosineSimilarity(
          queryEmbedding,
          chunk.embedding
        );

        return {
          ...chunk.toObject(),
          score: isNaN(score) ? 0 : score
        };
      })
      .filter(Boolean);

    scored.sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, 5);

    console.log("✅ TOP RESULTS:", topResults.length);

    return topResults;
  } catch (error) {
    console.error("❌ retrieveRules error:", error);
    return [];
  }
};