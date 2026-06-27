import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractPdfText = async (filePath) => {
  try {
    let buffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      console.log("🌐 Downloading PDF from URL:", filePath);
      const response = await fetch(filePath);  // ✅ built-in fetch, no import needed
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const fs = await import("fs");
      buffer = fs.readFileSync(filePath);
    }

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");
      text += pageText + "\n";
    }

    return {
      text,
      pages: pdf.numPages,
    };
  } catch (error) {
    throw new Error(`PDF Extraction Failed: ${error.message}`);
  }
};