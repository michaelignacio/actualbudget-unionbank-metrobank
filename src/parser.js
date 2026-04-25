export const EXCLUDE_KEYWORDS = ['BALANCE', 'AVAILABLE', 'CURRENT', 'PREVIOUS', 'STATEMENT', 'PERIOD', 'DATE', 'TOTAL', 'CARD NO', 'ACCOUNT', 'PENDING', 'CITY', 'EMBOURG', 'DOWNLOAD', 'HISTORY', 'ACCOUNT DETAILS'];

export function extractStructuredLines(lines) {
  return lines
    .filter(l => l.text.trim().length > 0)
    .map(l => ({ text: l.text.trim() }));
}

function toLocalDateString(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function detectBank(text) {
  if (!text) return null;
  const upper = text.toUpperCase();
  if (upper.includes('UNIONBANK') || upper.includes('UNION BANK')) return 'unionbank';
  if (upper.includes('METROBANK') || upper.includes('METRO BANK')) return 'metrobank';
  if (upper.includes('PLATINUM')) return 'metrobank';
  return null;
}

function findDateMMddYYYY(text) {
  if (!text) return null;
  const match = text.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
  if (match) {
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
}

function findDateMonthDayYear(text) {
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
  for (const kw of EXCLUDE_KEYWORDS) {
    if (text.toUpperCase().includes(kw)) return null;
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
  if (/^PHP/i.test(text)) return null;
  if (/^\d{1,2}[\/]/.test(text)) return null;
  if (/^[\d\s\/\-]+$/.test(text)) return null;
  
  let candidate = text.trim();
  candidate = candidate.replace(/\s*UNPOSTED\s*$/gi, '');
  const phpMatch = candidate.match(/PHP\s*[\d,]+\.?\d*/i);
  if (phpMatch) {
    candidate = candidate.replace(phpMatch[0], '').trim();
  }
  candidate = candidate.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (candidate.length >= 2 && candidate.length < 40) {
    return candidate;
  }
  return null;
}

export function parseAllTransactions(ocrResult, lines) {
  const text = ocrResult?.text || '';
  const bankType = detectBank(text);
  const structuredLines = extractStructuredLines(lines);
  const transactions = [];
  const seen = new Set();
  let monthHeader = null;
  
  if (bankType === 'metrobank') {
    for (let i = 0; i < structuredLines.length; i++) {
      const lineText = structuredLines[i].text;
      
      if (!lineText.includes('PHP')) continue;
      
      const amount = findAmount(lineText);
      if (!amount) continue;
      
      let merchant = null;
      let txDate = null;
      
      if (i >= 2) {
        merchant = findMerchant(structuredLines[i - 2].text);
        txDate = findDateMMddYYYY(structuredLines[i - 1].text);
      }
      
      if (merchant && txDate) {
        const key = `${txDate.toISOString()}-${amount}-${merchant}`;
        if (!seen.has(key)) {
          seen.add(key);
          transactions.push({
            date: toLocalDateString(txDate),
            amount,
            payee: merchant
          });
        }
      }
    }
  } else {
    for (let i = 0; i < structuredLines.length; i++) {
      const lineText = structuredLines[i].text;
      
      const mh = findMonthHeader(lineText);
      if (mh) monthHeader = mh;
      
      const amount = findAmount(lineText);
      if (amount) {
        const merchant = findMerchant(lineText);
        if (merchant) {
          let txDate = null;
          let dateFound = false;
          
          for (let j = i + 1; j <= i + 3 && j < structuredLines.length; j++) {
            const d = findDateMonthDayYear(structuredLines[j].text);
            if (d) { txDate = d; dateFound = true; break; }
          }
          if (!txDate && monthHeader) {
            txDate = monthHeader;
            dateFound = true;
          }
          
          if (txDate && dateFound) {
            const key = `${txDate.toISOString()}-${amount}-${merchant}`;
            if (!seen.has(key)) {
              seen.add(key);
              transactions.push({
                date: toLocalDateString(txDate),
                amount,
                payee: merchant
              });
            }
          }
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
    bankType: detectBank(ocrResult?.text || ''),
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
    notes: `Imported from ${parsed.bankType || 'bank'} screenshot`,
    cleared: false
  };
}