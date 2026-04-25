import { extractStructuredLines } from './ocr.js';

const EXCLUDE_KEYWORDS = ['BALANCE', 'AVAILABLE', 'CURRENT', 'PREVIOUS', 'STATEMENT', 'PERIOD', 'DATE', 'TOTAL', 'CARD NO', 'ACCOUNT', 'PENDING', 'CITY', 'EMBOURG', 'DOWNLOAD', 'HISTORY', 'ACCOUNT DETAILS'];

function toLocalDateString(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function findDateInLine(text) {
  if (!text) return null;
  const monthDate = text.match(/((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (monthDate) {
    const monthNames = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
    const monthStr = monthDate[1].toUpperCase().substring(0, 3);
    const month = monthNames[monthStr];
    const day = parseInt(monthDate[2]);
    const year = parseInt(monthDate[3]);
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function findMonthHeader(text) {
  const match = text.match(/^((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*)\s+(\d{4})$/i);
  if (match) {
    const monthNames = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
    const monthStr = match[1].toUpperCase().substring(0, 3);
    const month = monthNames[monthStr];
    const year = parseInt(match[2]);
    if (month !== undefined && year >= 2020 && year <= 2030) {
      return new Date(year, month, 1);
    }
  }
  return null;
}

function findAmount(text) {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const kw of EXCLUDE_KEYWORDS) {
    if (upper.includes(kw)) return null;
  }
  const match = text.match(/PHP\s*([\d,]+\.?\d*)/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0 && amount < 1000000) {
      return amount;
    }
  }
  return null;
}

function findMerchant(text) {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const kw of EXCLUDE_KEYWORDS) {
    if (upper.includes(kw)) return null;
  }
  if (/^[\d\s\/\-]+$/.test(text)) return null;
  const amount = text.match(/PHP\s*[\d,]+\.?\d*/i);
  if (amount) {
    let candidate = text.replace(amount[0], '').trim();
    candidate = candidate.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (candidate.length >= 2 && candidate.length < 40) {
      return candidate;
    }
  }
  return null;
}

export function parseAllTransactions(ocrResult, lines) {
  const structuredLines = extractStructuredLines(lines);
  const transactions = [];
  let monthHeader = null;
  
  for (let i = 0; i < structuredLines.length; i++) {
    const lineText = structuredLines[i].text || '';
    
    const mh = findMonthHeader(lineText);
    if (mh) monthHeader = mh;
    
    const amount = findAmount(lineText);
    if (amount) {
      const merchant = findMerchant(lineText);
      if (merchant) {
        let txDate = null;
        let dateFound = false;
        
        for (let j = i + 1; j <= i + 3 && j < structuredLines.length; j++) {
          const d = findDateInLine(structuredLines[j].text);
          if (d) {
            txDate = d;
            dateFound = true;
            break;
          }
        }
        
        if (txDate && dateFound) {
          transactions.push({
            date: toLocalDateString(txDate),
            amount,
            payee: merchant
          });
        }
      }
    }
  }
  
  return transactions;
}

export function parseOCRResult(ocrResult, lines) {
  const all = parseAllTransactions(ocrResult, lines);
  const best = all[0] || {};
  
  return {
    date: best.date ? new Date(best.date) : null,
    merchant: best.payee || null,
    amount: best.amount || null,
    bankType: null,
    metadata: { transactionsFound: all.length },
    allTransactions: all
  };
}

export function formatTransaction(parsed) {
  if (!parsed.date || !parsed.amount) return null;
  return {
    date: toLocalDateString(parsed.date),
    amount: parsed.amount,
    payee: parsed.merchant || 'Unknown',
    notes: `Imported from bank screenshot`,
    cleared: false
  };
}