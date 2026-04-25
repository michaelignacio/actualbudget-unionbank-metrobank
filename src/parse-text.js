import fs from 'fs';
import path from 'path';

export function parseTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim().replace(/\t/g, ' ')).filter(l => l);
  
  const dir = path.dirname(filePath);
  const bankType = dir.includes('metrobank') ? 'metrobank' : dir.includes('unionbank') ? 'unionbank' : null;
  
  if (bankType === 'unionbank') return parseUnionBankText(lines);
  if (bankType === 'metrobank') return parseMetrobankText(lines);
  return [];
}

function parseUnionBankText(lines) {
  const transactions = [];
  let currentMonth = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const monthMatch = line.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+\d{4}$/i);
    if (monthMatch) {
      const monthNames = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
      currentMonth = new Date(parseInt(monthMatch[2]), monthNames[monthMatch[1].toUpperCase().substring(0,3)], 1);
      continue;
    }
    
    if (!line.startsWith('PHP') || line.includes('PENDING')) continue;
    
    const amount = parseFloat(line.match(/PHP\s*([\d,]+\.?\d*)/i)?.[1]?.replace(/,/g, '') || '0');
    if (amount <= 0) continue;
    
    let merchant = null, date = currentMonth;
    for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
      const prev = lines[j];
      if (!date?.getTime()) {
        const dm = prev.match(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{1,2}),?\s*(\d{4})/i);
        if (dm) date = new Date(parseInt(dm[3]), {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11}[dm[1].toUpperCase().substring(0,3)], parseInt(dm[2]));
      }
      if (!merchant && prev.length > 1 && !prev.match(/^PHP/i) && !prev.match(/^[A-Z]{3}\s\d{4}/i)) {
        merchant = prev.replace(/[^\w\s&]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      if (merchant && date) break;
    }
    if (merchant && date) transactions.push({date: formatDate(date), amount, payee: merchant});
  }
  return transactions;
}

function parseMetrobankText(lines) {
  const transactions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amount = parseFloat(line.match(/PHP\s*\(?([\d,.]+)/i)?.[1]?.replace(/,/g, '') || '0');
    if (!line.includes('PHP') || amount <= 0) continue;
    
    let merchant = null, date = null;
    
    const prevLine = i > 0 ? lines[i - 1] : '';
    if (prevLine) {
      const dm = prevLine.match(/([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})/);
      if (dm) date = new Date(parseInt(dm[3]), {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11}[dm[1]], parseInt(dm[2]));
      const merchantCandidate = prevLine.split(/\s[A-Z][a-z]{2}\s+\d+/)[0]?.replace(/[^\w\s,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (merchantCandidate && merchantCandidate.length > 1 && merchantCandidate.length < 40) {
        merchant = merchantCandidate;
      }
    }
    
    if (merchant && date) transactions.push({date: formatDate(date), amount: Math.abs(amount), payee: merchant});
  }
  return transactions;
}

function formatDate(date) {
  return date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : null;
}