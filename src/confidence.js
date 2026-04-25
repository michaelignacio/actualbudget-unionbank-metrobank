export function computeConfidence(parsed, ocrResult) {
  let score = 0;
  const factors = [];

  if (parsed.date && parsed.date instanceof Date && !isNaN(parsed.date.getTime())) {
    score += 40;
    factors.push({ factor: 'valid_date', points: 40 });
  }

  if (parsed.amount && parsed.amount > 0 && parsed.amount < 10000000) {
    score += 40;
    factors.push({ factor: 'valid_amount', points: 40 });
  }

  if (parsed.merchant && parsed.merchant.length >= 2) {
    score += 20;
    factors.push({ factor: 'valid_merchant', points: 20 });
  }

  if (parsed.bankType) {
    score += 20;
    factors.push({ factor: 'bank_detected', points: 20 });
  }

  if (ocrResult.confidence && ocrResult.confidence > 70) {
    score += 10;
    factors.push({ factor: 'high_ocr_confidence', points: 10 });
  }

  return {
    score,
    factors,
    threshold: {
      autoImport: 60,
      review: 40
    }
  };
}

export function getAction(confidence) {
  if (confidence.score >= 60) return 'import';
  if (confidence.score >= 40) return 'review';
  return 'skip';
}