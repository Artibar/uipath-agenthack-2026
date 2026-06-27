import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractPdfText = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);

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