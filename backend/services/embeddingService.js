import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const createEmbedding = async (text) => {
  try {
    const result = await hf.featureExtraction({
      model: "BAAI/bge-small-en-v1.5",
      inputs: text
    });

    return Array.from(result);
  } catch (error) {
    throw new Error(
      `Embedding failed: ${error.message}`
    );
  }
};