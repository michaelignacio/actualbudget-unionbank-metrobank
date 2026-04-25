import { recognizeText } from './ocr.js';

const result = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/failed/IMG_4689.PNG');
console.log('=== FULL OCR TEXT ===');
console.log(result.text);
console.log('\n=== LINES ===');
result.lines.forEach((l, i) => console.log(`${i}: "${l.text}" (${l.confidence}%)`));