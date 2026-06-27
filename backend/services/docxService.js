import mammoth from "mammoth";

export const extractDocxText = async (filePath) => {
  try {
    let buffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      console.log("🌐 Downloading DOCX from URL:", filePath);
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Local dev fallback
      const fs = await import("fs");
      const path = await import("path");
      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error("File not found");
      }
      buffer = fs.readFileSync(resolvedPath);
    }

    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
    };
  } catch (error) {
    throw new Error(`DOCX Extraction Failed: ${error.message}`);
  }
};