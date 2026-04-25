import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { recognizeText } from './ocr.js';
import { parseOCRResult, formatTransaction } from './parser.js';
import { computeConfidence, getAction } from './confidence.js';
import { generateImportedId, isDuplicate, markAsProcessed } from './dedupe.js';
import { loadConfig, importTransaction } from './actual.js';
import { SCREENSHOTS_DIR, PROCESSED_DIR, FAILED_DIR, LOGS_DIR } from './constants.js';

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function processFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n[PROCESS] Processing: ${filename}`);

  let ocrResult;
  try {
    ocrResult = await recognizeText(filePath);
    console.log(`[OCR] Raw text extracted (${ocrResult.confidence}% confidence)`);
    console.log(`[OCR] Text preview: ${ocrResult.text.substring(0, 300)}...`);
  } catch (e) {
    console.error(`[ERROR] OCR failed: ${e.message}`);
    moveFile(filePath, FAILED_DIR);
    return;
  }

  let parsed;
  let lines;
  try {
    lines = ocrResult.lines;
    parsed = parseOCRResult(ocrResult, lines);
    console.log(`[PARSER] Parsed: date=${parsed.date}, amount=${parsed.amount}, merchant=${parsed.merchant}, bank=${parsed.bankType}`);
  } catch (e) {
    console.error(`[ERROR] Parse failed: ${e.message}`);
    moveFile(filePath, FAILED_DIR);
    return;
  }

  const formatted = formatTransaction(parsed);
  if (!formatted) {
    console.log(`[PARSE] Could not format transaction (missing required fields)`);
    moveFile(filePath, FAILED_DIR);
    return;
  }

  const confidence = computeConfidence(parsed, ocrResult);
  console.log(`[CONFIDENCE] Score: ${confidence.score}/120`, confidence.factors.map(f => `${f.factor}:+${f.points}`).join(', '));

  const action = getAction(confidence);
  console.log(`[CONFIDENCE] Action: ${action}`);

  if (action === 'skip') {
    console.log(`[SKIP] Confidence too low, flagging for review`);
    moveFile(filePath, FAILED_DIR);
    return;
  }

  const accountName = parsed.bankType === 'unionbank' ? 'UnionBank Main' : 'Metrobank Savings';
  formatted.accountName = accountName;

  const importedId = generateImportedId({
    date: formatted.date,
    payee: formatted.payee,
    amount: formatted.amount
  });
  
  formatted.imported_id = importedId;

  if (isDuplicate(importedId)) {
    console.log(`[DEDUP] Duplicate detected, skipping`);
    moveFile(filePath, PROCESSED_DIR);
    return;
  }

  if (action === 'review') {
    console.log(`[REVIEW] Flagging for manual review`);
    logForReview(formatted, confidence, ocrResult.text);
    moveFile(filePath, FAILED_DIR);
    return;
  }

  try {
    const result = await importTransaction(formatted, accountName);
    console.log(`[IMPORT] Success! Transaction ID: ${result.id}`);
    markAsProcessed(formatted, importedId, 'imported');
  } catch (e) {
    console.error(`[ERROR] Import failed: ${e.message}`);
    logForReview(formatted, confidence, ocrResult.text);
    return;
  }

  moveFile(filePath, PROCESSED_DIR);
  console.log(`[DONE] ${filename} processed successfully`);
}

function moveFile(filePath, destDir) {
  const filename = path.basename(filePath);
  const destPath = path.join(destDir, filename);
  
  let counter = 1;
  while (fs.existsSync(destPath)) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const newFilename = `${base}_${counter}${ext}`;
    counter++;
  }

  fs.renameSync(filePath, destPath);
  console.log(`[FILE] Moved to ${destDir}`);
}

function logForReview(transaction, confidence, rawOCR) {
  const reviewLog = {
    timestamp: new Date().toISOString(),
    transaction,
    confidence,
    rawOCR: rawOCR.substring(0, 1000)
  };
  
  console.log(`[REVIEW] Review data:`, JSON.stringify(reviewLog, null, 2));
  
  const logPath = path.join(LOGS_DIR, 'review.log');
  fs.appendFileSync(logPath, JSON.stringify(reviewLog) + '\n');
}

async function processExisting() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`[INIT] Created screenshots directory`);
    return;
  }

  const files = fs.readdirSync(SCREENSHOTS_DIR);
  const imageFiles = files.filter(f => 
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );

  console.log(`[INIT] Found ${imageFiles.length} existing files`);

  for (const file of imageFiles) {
    const filePath = path.join(SCREENSHOTS_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      await processFile(filePath);
    }
  }
}

async function main() {
  console.log('=== Actual Budget Import Pipeline ===');
  console.log(`[CONFIG] Loading config...`);
  
  try {
    loadConfig();
    console.log(`[CONFIG] Loaded`);
  } catch (e) {
    console.error(`[ERROR] Config load failed: ${e.message}`);
    process.exit(1);
  }

  await processExisting();
  
  console.log(`[WATCH] Watching ${SCREENSHOTS_DIR} for new files...`);
}

main().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});