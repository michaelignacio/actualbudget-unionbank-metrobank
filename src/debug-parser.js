import { recognizeText } from './ocr.js';
import { parseOCRResult, formatTransaction } from './parser.js';
import { computeConfidence, getAction } from './confidence.js';

const result = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/failed/IMG_4689.PNG');

console.log('=== OCR RESULT ===');
console.log(result.text);
console.log('\n=== PARSING ===');

const parsed = parseOCRResult(result, result.lines);
console.log('Parsed:', JSON.stringify(parsed, null, 2));

const formatted = formatTransaction(parsed);
console.log('Formatted:', JSON.stringify(formatted, null, 2));

const conf = computeConfidence(parsed, result);
console.log('Confidence:', conf.score, conf.factors.map(f => `${f.factor}:+${f.points}`).join(', '));
console.log('Action:', getAction(conf));