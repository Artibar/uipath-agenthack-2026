import Regulation from "../models/Regulation.js";
import RegulationChunk from "../models/RegulationChunk.js";
import { chunkText } from "../services/chunkService.js";
import { createEmbedding } from "../services/embeddingService.js";

export const indexRegulations = async () => {
  const regulations = await Regulation.find();

  console.log("📄 Regulations found:", regulations.length);

  for (const regulation of regulations) {
    const chunks = await chunkText(regulation.content);

    console.log(`🔹 Processing: ${regulation.title} → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);

      await RegulationChunk.create({
        regulationId: regulation._id,
        title: regulation.title,
        chunkText: chunks[i],
        embedding,
        chunkIndex: i
      });
    }
  }

  console.log("✅ INDEXING COMPLETE");
};