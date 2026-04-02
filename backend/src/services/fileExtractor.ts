import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {

  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy();
    }
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimetype === "application/json" || mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error("Formato não suportado para extração restrita do OWASP FileSanity.");
}
