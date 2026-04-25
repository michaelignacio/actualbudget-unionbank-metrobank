import { parseTextFile } from './parse-text.js';
import fs from 'fs';

const p = '/Users/michael/Sites/personal/actualbudget-extension/text-input/metrobank/04-25-26.txt';
console.log('=== PARSING ===');
const transactions = parseTextFile(p);
console.log(`Found ${transactions.length} transactions`);
transactions.forEach((tx, i) => console.log(`${i+1}. ${tx.date} | Php${tx.amount.toLocaleString()} | ${tx.payee}`));