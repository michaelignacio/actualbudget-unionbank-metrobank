import { parseOCRResult, formatTransaction } from './parser.js';
import { computeConfidence, getAction } from './confidence.js';

const ocrResult = {
  text: `UNIONBANK OF THE PHILIPPINES
Card No.: **** **** **** 1234
Statement Period: 01/01/2024 - 01/31/2024

Date        Description           Amount
01/15/2024  GCASH TRANSFER       P1,500.00
01/18/2024  SHOPEE PURCHASE      P2,350.00
01/20/2024  NETFLIX SUBSCRIPTIONP299.00

Available Balance: P12,345.67
Current Balance: P12,345.67`,
  confidence: 85,
  lines: [
    { text: 'UNIONBANK OF THE PHILIPPINES', confidence: 95 },
    { text: 'Card No.: **** **** **** 1234', confidence: 90 },
    { text: 'Statement Period: 01/01/2024 - 01/31/2024', confidence: 88 },
    { text: '', confidence: 0 },
    { text: 'Date        Description           Amount', confidence: 85 },
    { text: '01/15/2024  GCASH TRANSFER       P1,500.00', confidence: 82 },
    { text: '01/18/2024  SHOPEE PURCHASE      P2,350.00', confidence: 80 },
    { text: '01/20/2024  NETFLIX SUBSCRIPTIONP299.00', confidence: 78 },
    { text: '', confidence: 0 },
    { text: 'Available Balance: P12,345.67', confidence: 88 },
    { text: 'Current Balance: P12,345.67', confidence: 88 }
  ]
};

console.log('=== UNIONBANK TEST ===');
const parsed = parseOCRResult(ocrResult, ocrResult.lines);
console.log('PARSED:', JSON.stringify(parsed, null, 2));

const formatted = formatTransaction(parsed);
console.log('FORMATTED:', JSON.stringify(formatted, null, 2));

const conf = computeConfidence(parsed, ocrResult);
console.log('CONFIDENCE:', JSON.stringify(conf, null, 2));
console.log('ACTION:', getAction(conf));

const ocrResult2 = {
  text: `Metrobank
Account: ****4567
Statement Date: 02/15/2024

Trans Date   Description        Amount
02/01/2024   7-ELEVEN PURCHASE   ₱450.00
02/05/2024   MERALCO BILL        ₱2,890.00
02/10/2024   SALARY DEPOSIT      ₱38,500.00

Available Balance: ₱8,765.43`,
  confidence: 82,
  lines: [
    { text: 'Metrobank', confidence: 95 },
    { text: 'Account: ****4567', confidence: 90 },
    { text: 'Statement Date: 02/15/2024', confidence: 88 },
    { text: '', confidence: 0 },
    { text: 'Trans Date   Description        Amount', confidence: 85 },
    { text: '02/01/2024   7-ELEVEN PURCHASE   ₱450.00', confidence: 82 },
    { text: '02/05/2024   MERALCO BILL        ₱2,890.00', confidence: 80 },
    { text: '02/10/2024   SALARY DEPOSIT      ₱38,500.00', confidence: 78 },
    { text: '', confidence: 0 },
    { text: 'Available Balance: ₱8,765.43', confidence: 88 }
  ]
};

console.log('\n=== METROBANK TEST ===');
const parsed2 = parseOCRResult(ocrResult2, ocrResult2.lines);
console.log('PARSED:', JSON.stringify(parsed2, null, 2));

const formatted2 = formatTransaction(parsed2);
console.log('FORMATTED:', JSON.stringify(formatted2, null, 2));

const conf2 = computeConfidence(parsed2, ocrResult2);
console.log('CONFIDENCE:', JSON.stringify(conf2, null, 2));
console.log('ACTION:', getAction(conf2));