import { parseTextFile } from './parse-text.js';
import { importTransaction } from './actual.js';
import { loadConfig } from './constants.js';
import { generateImportedId, isDuplicate, markAsProcessed } from './dedupe.js';
import fs from 'fs';
import path from 'path';

const METROBANK_DIR = '/Users/michael/Sites/personal/actualbudget-extension/text-input/metrobank';

async function importFromText() {
  console.log('=== IMPORTING FROM TEXT FILES ===\n');
  
  const files = fs.readdirSync(METROBANK_DIR).filter(f => f.endsWith('.txt'));
  console.log(`Found ${files.length} text files\n`);
  
  for (const file of files) {
    const filePath = path.join(METROBANK_DIR, file);
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
        await importTransaction(formatted, 'Metrobank Savings');
        console.log(`  [OK] ${tx.date} | Php${tx.amount} | ${tx.payee}`);
        markAsProcessed(formatted, importedId, 'imported');
      } catch (e) {
        console.log(`  [ERROR] ${tx.date} | Php${tx.amount} | ${tx.payee}: ${e.message}`);
      }
    }
    
    console.log('');
  }
}

importFromText();