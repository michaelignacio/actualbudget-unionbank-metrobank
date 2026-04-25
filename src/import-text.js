import { parseTextFile } from './parse-text.js';
import { importTransaction } from './actual.js';
import { loadConfig } from './constants.js';
import { generateImportedId, isDuplicate, markAsProcessed } from './dedupe.js';
import fs from 'fs';
import path from 'path';

const METROBANK_DIR = '/Users/michael/Sites/personal/actualbudget-extension/text-input/metrobank';
const UNIONBANK_DIR = '/Users/michael/Sites/personal/actualbudget-extension/text-input/unionbank';

async function importFromText(bankDir, accountName) {
  const files = fs.readdirSync(bankDir).filter(f => f.endsWith('.txt'));
  console.log(`=== IMPORTING FROM ${accountName.toUpperCase()} ===\n`);
  console.log(`Found ${files.length} text files\n`);
  
  for (const file of files) {
    const filePath = path.join(bankDir, file);
    console.log(`Processing: ${file}`);
    
    const transactions = parseTextFile(filePath);
    console.log(`Found ${transactions.length} transactions\n`);
    
    for (const tx of transactions) {
      const importedId = generateImportedId({
        date: tx.date,
        payee: tx.payee,
        amount: tx.amount
      });
      
      if (isDuplicate(importedId)) {
        console.log(`  [SKIP] ${tx.date} | Php${tx.amount} | ${tx.payee} (duplicate)`);
        continue;
      }
      
      const formatted = {
        date: tx.date,
        amount: tx.isDeposit ? tx.amount : -tx.amount,
        payee: tx.payee,
        cleared: false,
        imported_id: importedId
      };
      
      try {
        await importTransaction(formatted, accountName);
        console.log(`  [OK] ${tx.date} | Php${tx.amount} | ${tx.payee}`);
        markAsProcessed(formatted, importedId, 'imported');
      } catch (e) {
        console.log(`  [ERROR] ${tx.date} | Php${tx.amount} | ${tx.payee}: ${e.message}`);
      }
    }
    
    console.log('');
  }
}

async function run() {
  if (fs.existsSync(UNIONBANK_DIR)) {
    await importFromText(UNIONBANK_DIR, 'UnionBank Main');
  }
  if (fs.existsSync(METROBANK_DIR)) {
    await importFromText(METROBANK_DIR, 'Metrobank Savings');
  }
}

run();