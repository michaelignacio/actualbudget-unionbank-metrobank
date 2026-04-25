import { recognizeText } from './ocr.js';
import { parseAllTransactions } from './parser.js';

console.log('=== METROBANK SCREENSHOT ===');
const ocr1 = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/metrobank-screenshot-01.png');
const txs1 = parseAllTransactions(ocr1, ocr1.lines);
console.log(`Bank: ${ocr1.text.includes('PLATINUM') ? 'Metrobank' : 'Unknown'}`);
txs1.forEach((tx, i) => console.log(`${i+1}. ${tx.date} | ₱${tx.amount.toLocaleString()} | ${tx.payee}`));

console.log('\n=== UNIONBANK SCREENSHOT ===');
const ocr2 = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/failed/IMG_4689.PNG');
const txs2 = parseAllTransactions(ocr2, ocr2.lines);
console.log(`Bank: ${ocr2.text.includes('UNIONBANK') ? 'UnionBank' : 'Unknown'}`);
txs2.forEach((tx, i) => console.log(`${i+1}. ${tx.date} | ₱${tx.amount.toLocaleString()} | ${tx.payee}`));