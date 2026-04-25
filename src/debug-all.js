import { recognizeText } from './ocr.js';
import { parseAllTransactions } from './parser.js';

const ocr = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/failed/IMG_4689.PNG');
const txs = parseAllTransactions(ocr, ocr.lines);

console.log('=== ALL TRANSACTIONS ===');
txs.forEach((tx, i) => {
  console.log(`${i+1}. ${tx.date} | ₱${tx.amount.toLocaleString()} | ${tx.payee}`);
});