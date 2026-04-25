import { recognizeText } from './ocr.js';

const ocr = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/metrobank-screenshot-01.png');
console.log('=== OCR TEXT ===');
console.log(ocr.text);
console.log('\n=== LINES ===');
ocr.lines.forEach((l, i) => console.log(`${i}: ${l.text}`));