import mammoth from "mammoth";
import fs from "fs";
import path from "path";

export const extractDocxText = async (filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);

    console.log("Incoming path:", filePath);
    console.log("Resolved path:", resolvedPath);
    console.log("Exists:", fs.existsSync(resolvedPath));

    if (!fs.existsSync(resolvedPath)) {
      throw new Error("File not found");
    }

    const stats = fs.statSync(resolvedPath);
    console.log("File size:", stats.size);

    const result = await mammoth.extractRawText({
      path: resolvedPath
    });

    return {
      text: result.value
    };
  } catch (error) {
    throw new Error(`DOCX Extraction Failed: ${error.message}`);
  }
};