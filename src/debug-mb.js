import { recognizeText } from './ocr.js';

function findAmount(text) {
  if (!text) return null;
  if (text.toUpperCase().includes('UNPOSTED')) return null;
  const match = text.match(/PHP\s*([\d,]+\.?\d*)/i);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0 && amount < 1000000) return amount;
  }
  return null;
}

function findDateMMddYYYY(text) {
  if (!text) return null;
  const match = text.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
  if (match) {
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
}

const ocr = await recognizeText('/Users/michael/Sites/personal/actualbudget-extension/screenshots/metrobank-screenshot-01.png');

console.log('=== METROBANK DEBUG ===');
for (let i = 0; i < ocr.lines.length; i++) {
  const lineText = ocr.lines[i].text.trim();
  if (!lineText) continue;
  
  if (lineText.includes('PHP')) {
    const amount = findAmount(lineText);
    const parts = lineText.includes('+') ? lineText.split('+')[0] : lineText;
    console.log(`\nLine ${i}: "${lineText}"`);
    console.log(`  Amount: ${amount}, LeftPart: "${parts.trim()}"`);
    
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      const date = findDateMMddYYYY(ocr.lines[j].text);
      if (date) {
        console.log(`  Date at line ${j}: ${date.toISOString().split('T')[0]}`);
        break;
      }
    }
  }
}