import Regulation from "../models/Regulation.js";
import RegulationChunk from "../models/RegulationChunk.js";
import { chunkText } from "../services/chunkService.js";
import { createEmbedding } from "../services/embeddingService.js";

export const indexRegulations = async () => {
  const regulations = await Regulation.find();
  console.log("📄 Regulations found:", regulations.length);

  // Clear old chunks first
  await RegulationChunk.deleteMany({});
  console.log("🗑️ Cleared old chunks");

  for (const regulation of regulations) {
    const chunks = await chunkText(regulation.content);
    console.log(`🔹 [${regulation.category}] ${regulation.title} → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);
      await RegulationChunk.create({
        regulationId: regulation._id,
        title: regulation.title,
        chunkText: chunks[i],
        embedding,
        chunkIndex: i,
        category: regulation.category || "general"  // ✅ pass category
      });
    }
  }
  console.log("✅ INDEXING COMPLETE");
};