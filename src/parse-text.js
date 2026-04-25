import fs from 'fs';
import path from 'path';

export function parseTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim().replace(/\t/g, ' ')).filter(l => l);
  
  const dir = path.dirname(filePath);
  const bankType = dir.indexOf('metrobank') !== -1 ? 'metrobank' : dir.indexOf('unionbank') !== -1 ? 'unionbank' : null;
  
  if (bankType === 'unionbank') return parseUnionBankText(lines);
  if (bankType === 'metrobank') return parseMetrobankText(lines);
  return [];
}

function parseUnionBankText(lines) {
  const transactions = [];
  let currentMonth = null;
  
  const monthMap = {
    january:0, jan:0, february:1, feb:1, march:2, mar:2, april:3, apr:3,
    may:4, june:5, jul:6, july:5, august:7, aug:7, september:8, sep:8,
    october:9, oct:9, november:10, nov:10, december:11, dec:11
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const monthMatch = line.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+\d{4}$/i);
    if (monthMatch) {
      const monthName = line.toLowerCase().substring(0,3);
      const year = parseInt(line.match(/\d{4}/)[0]);
      currentMonth = new Date(year, monthMap[monthName] ?? 0, 1);
      continue;
    }
    
    if (line.indexOf("PENDING") !== -1) continue;
    
    const amountMatch = line.match(/^(-?\s*PHP\s*[\d,]+\.?\d*)$/i);
    if (!amountMatch) continue;
    
    const rawAmount = amountMatch[1];
    const cleanAmount = rawAmount.replace(/PHP\s*/i, '').replace(/,\s*/g, '').replace(/^-?\s*/, '').trim();
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount === 0) continue;
    
    let isDeposit = rawAmount.indexOf('-') !== -1 || amount < 0;
    const absAmount = Math.abs(amount);
    
    let merchant = null, date = null;
    
    for (let j = i - 1; j >= 0 && j >= i - 2; j--) {
      const prev = lines[j];
      
      if (!date) {
        const dm = prev.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
        if (dm) {
          const mname = dm[1].toLowerCase().substring(0,3);
          date = new Date(parseInt(dm[3]), monthMap[mname] ?? 0, parseInt(dm[2]));
        }
      }
      
      if (!merchant && prev.length > 2 && prev.indexOf("PHP") === -1 && !prev.match(/^[A-Za-z]+\s+\d+/i)) {
        merchant = prev.replace(/[^\w\s&,]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      
      if (merchant && date) break;
    }
    
    if (!merchant && isDeposit && lines[i + 1]) {
      merchant = lines[i + 1].replace(/[^\w\s&,]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    if (!date && currentMonth) date = currentMonth;
    
    if (merchant && date) transactions.push({date: formatDate(date), amount: absAmount, payee: merchant, isDeposit});
  }
  return transactions;
}

function parseMetrobankText(lines) {
  const transactions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amount = parseFloat(line.match(/PHP\s*\(?([\d,.]+)/i)?.[1]?.replace(/,/g, '') || '0');
    if (line.indexOf("PHP") === -1 || amount <= 0) continue;
    
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
    
    if (merchant && date) {
      const isDeposit = merchant.toUpperCase().indexOf("CASH PAYMENT") !== -1;
      transactions.push({date: formatDate(date), amount: Math.abs(amount), payee: merchant, isDeposit});
    }
  }
  return transactions;
}

function formatDate(date) {
  return date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : null;
}