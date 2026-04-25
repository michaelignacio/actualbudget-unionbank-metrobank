import { recognizeText } from './ocr.js';
import { parseOCRResult, formatTransaction } from './parser.js';
import { computeConfidence } from './confidence.js';

const result = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/failed/IMG_4689.PNG');

const lines = result.lines;

console.log('=== LINE-BY-LINE DEBUG ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].text || '';
  if (line.includes('PHP')) {
    const date = i > 0 ? lines[i-1].text : '';
    const next = i < lines.length - 1 ? lines[i+1].text : '';
    console.log(`Line ${i}: "${line.substring(0,40)}"`);
    console.log(`  Prev line: "${date.substring(0,30)}" -> date: ${date.includes('April') || date.includes(',')}`);
    console.log(`  Next line: "${next.substring(0,30)}" -> date: ${next.includes('April') || next.includes(',')}`);
    console.log();
  }
}