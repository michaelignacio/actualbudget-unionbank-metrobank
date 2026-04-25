import { recognizeText } from './ocr.js';
import { parseAllTransactions } from './parser.js';

const p = '/Users/michael/Sites/personal/actualbudget-extension/screenshots/new-screenshot.png';
const ocr = await recognizeText(p);

console.log('=== OCR TEXT ===');
console.log(ocr.text);
console.log('\n=== ALL TRANSACTIONS ===');
const txs = parseAllTransactions(ocr, ocr.lines);
txs.forEach((tx, i) => console.log(`${i+1}. ${tx.date} | Php${tx.amount.toLocaleString()} | ${tx.payee}`));