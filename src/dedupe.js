import crypto from 'crypto';
import fs from 'fs';
import { PROCESSED_FILE } from './constants.js';

function loadProcessed() {
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      const data = fs.readFileSync(PROCESSED_FILE, 'utf8');
      return data ? JSON.parse(data) : [];
    }
  } catch (e) {
    console.error('[DEDUP] Error loading processed:', e.message);
  }
  return [];
}

function saveProcessed(records) {
  try {
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(records, null, 2));
  } catch (e) {
    console.error('[DEDUP] Error saving processed:', e.message);
  }
}

export function generateImportedId(data) {
  const hashInput = [
    data.date,
    data.payee || data.merchant || '',
    data.amount || 0,
    data.accountId || ''
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex')
    .substring(0, 16);
}

export function isDuplicate(importedId) {
  const records = loadProcessed();
  return records.some(r => r.importedId === importedId);
}

export function markAsProcessed(data, importedId, status) {
  const records = loadProcessed();
  
  records.push({
    importedId,
    date: data.date,
    payee: data.payee || data.merchant || '',
    amount: data.amount,
    accountId: data.accountId || '',
    importedAt: new Date().toISOString(),
    status
  });

  saveProcessed(records);
  console.log(`[DEDUP] Marked ${importedId} as ${status}`);
}