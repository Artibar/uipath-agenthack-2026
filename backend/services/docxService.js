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
      console.log("✅ Buffer size:", buffer.length);
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error("File not found");
      }
      buffer = fs.readFileSync(resolvedPath);
    }

    const result = await mammoth.extractRawText({ buffer });
    
    // ✅ ADD DEBUG
    console.log("📝 Mammoth result:", JSON.stringify(result));
    console.log("📝 Extracted text length:", result.value?.length);
    console.log("📝 Extracted text preview:", result.value?.substring(0, 200));

    if (!result.value || result.value.trim().length === 0) {
      throw new Error("Mammoth extracted empty text from DOCX");
    }

    return {
      text: result.value,
    };
  } catch (error) {
    console.error("❌ DOCX extraction error:", error.message);
    throw new Error(`DOCX Extraction Failed: ${error.message}`);
  }
};