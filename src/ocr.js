import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';

const WORKER_CONFIG = {
  logger: m => process.env.DEBUG && console.log(`[OCR] ${m}`)
};

export async function preprocessImage(imagePath) {
  const buffer = await sharp(imagePath)
    .greyscale()
    .normalize()
    .sharpen()
    .toBuffer();
  return buffer;
}

export async function recognizeText(imagePath, options = {}) {
  const { enhance = true, language = 'eng' } = options;
  
  let imageBuffer;
  if (enhance) {
    imageBuffer = await preprocessImage(imagePath);
  } else {
    imageBuffer = fs.readFileSync(imagePath);
  }

  const worker = await Tesseract.createWorker(language, 1, {
    ...WORKER_CONFIG,
    corePath: undefined
  });

  const result = await worker.recognize(imageBuffer);
  await worker.terminate();

  const { data } = result;
  
  const blocks = data.blocks?.map(block => ({
    text: block.text,
    confidence: block.confidence,
    lines: block.lines?.map(line => ({
      text: line.text,
      confidence: line.confidence
    }))
  })) || [];

  return {
    text: data.text,
    confidence: data.confidence,
    blocks,
    lines: data.lines?.map(l => ({
      text: l.text,
      confidence: l.confidence
    })) || []
  };
}

export function extractStructuredLines(lines) {
  return lines
    .filter(l => l.text.trim().length > 0)
    .map(l => ({
      text: l.text.trim(),
      confidence: l.confidence
    }));
}