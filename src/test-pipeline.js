import { parseOCRResult, formatTransaction } from './parser.js';
import { computeConfidence, getAction } from './confidence.js';
import { generateImportedId, isDuplicate, markAsProcessed } from './dedupe.js';

const testData = [
  {
    name: 'UnionBank GCASH Transfer',
    ocrResult: {
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
    }
  },
  {
    name: 'Metrobank 7-Eleven',
    ocrResult: {
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
    }
  }
];

console.log('=== PIPELINE TEST ===\n');

for (const test of testData) {
  console.log(`--- Test: ${test.name} ---`);
  
  const parsed = parseOCRResult(test.ocrResult, test.ocrResult.lines);
  console.log('\n1. Parsed transaction:');
  console.log('   ', JSON.stringify(parsed));
  
  const formatted = formatTransaction(parsed);
  if (!formatted) {
    console.log('   FAILED: Could not format transaction');
    continue;
  }
  
  console.log('\n2. Formatted transaction:');
  console.log('   ', JSON.stringify(formatted));
  
  const confidence = computeConfidence(parsed, test.ocrResult);
  console.log('\n3. Confidence score:', confidence.score);
  console.log('   ', confidence.factors.map(f => `${f.factor}:+${f.points}`).join(', '));
  
  const action = getAction(confidence);
  console.log('\n4. Action:', action);
  
  const importedId = generateImportedId({
    date: formatted.date,
    payee: formatted.payee,
    amount: formatted.amount
  });
  console.log('\n5. imported_id:', importedId);
  
  const isDup = isDuplicate(importedId);
  console.log('   Is duplicate:', isDup);
  
  const milliunits = formatted.amount * 1000;
  console.log('\n6. API payload:');
  console.log('   date:', formatted.date);
  console.log('   amount:', -milliunits, '(milliunits, negative for expense)');
  console.log('   payee:', formatted.payee);
  console.log('   imported_id:', importedId);
  
  markAsProcessed(formatted, importedId, 'test');
  console.log('\n---');
}

console.log('\n=== TEST COMPLETE ===');
console.log('\nExpected output for Actual Budget API:');
console.log(`
POST /api/budget/{budgetId}/transactions
{
  "account": "acct_xxx123",
  "date": "2024-01-14",
  "amount": -1500000,
  "payee": "GCASH TRANSFER",
  "notes": "Imported from unionbank screenshot",
  "imported_id": "abc123def4567890"
}
`);