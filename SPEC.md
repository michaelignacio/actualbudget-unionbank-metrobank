# Actual Budget Transaction Import Pipeline

## Project Overview

- **Project name**: actual-budget-import-pipeline
- **Type**: Node.js CLI automation tool
- **Core functionality**: Auto-import transactions from banking screenshots (UnionBank + Metrobank PH) into self-hosted Actual Budget
- **Target users**: Self-hosted Actual Budget users in the Philippines

## Functionality Specification

### Core Features

#### 1. File Watcher
- Watches `/screenshots` directory for new image files
- Supported formats: PNG, JPG, JPEG
- Debounces processing to handle file write completion
- Moves processed files to `/screenshots/processed` or `/screenshots/failed`

#### 2. OCR Layer
- Uses Tesseract.js (Node.js native bindings)
- Language: Philippine-specific English + number recognition
- Returns raw text with confidence scores per block
- Handles image preprocessing (contrast enhancement)

#### 3. Parsing Logic

##### UnionBank Format Detection
- Transaction format: `MM/DD/YYYY DESCRIPTION AMOUNT`
- Amount format: `P1,234.56` or `PHP 1,234.56`
- Date format: `MM/DD/YY` or `MM/DD/YYYY`
- Recognized by: `UNIONBANK` header, `Available Balance` field

##### Metrobank Format Detection
- Transaction format: `MM/DD/YYYY DESCRIPTION AMOUNT`
- Amount format: `Php 1,234.56` or `1,234.56`
- Date format: `MM/DD/YY` or `MM/DD/YYYY`
- Recognized by: `METROBANK` header, peso symbol `₱`

##### Extraction Rules
- **Date**: Match `MM/DD/YYYY`, `MM/DD/YY`, `DD-MMM-YYYY`, `DD MMM YYYY`
- **Amount**: Find last/nearest amount near description, exclude Available Balance fields
- **Merchant**: First substantial text after date, exclude common keywords (Payment, Transfer, Balance)

#### 4. Confidence Scoring
- Date found with valid format: +40 points
- Amount found with valid format: +40 points
- Merchant found (non-empty): +20 points
- Bank format detected: +20 points
- **Threshold**: >= 60 to auto-import, 40-59 for review, <40 skip

#### 5. Actual Budget Integration
- Uses `@actual-app/api` for self-hosted Actual Budget
- Fetches accounts on startup, maps by name
- Converts PHP to milliunits (multiply by 1000)
- Generates deterministic `imported_id` using SHA-256 hash of: date + merchant + amount + account

#### 6. Deduplication
- Stores processed transaction IDs in `/data/processed.json`
- On import, checks if hash already exists
- Skips duplicates silently

### User Interactions
1. Place screenshot in `/screenshots` directory
2. Run `npm start` or `npm run watch`
3. Review flagged transactions in logs

### Data Handling
- Processed records: `data/processed.json` (JSON lines format)
- Config: `config.json` (Actual Budget server URL, credentials)
- Logs: stdout + `logs/import.log`

### Edge Cases
- OCR completely fails → log error, move to `/screenshots/failed`
- Parse confidence < 40 → flag for review, skip import
- No account mapping found → log error, skip
- Network to Actual fails → retry 3x, then flag for review

## Acceptance Criteria

1. Adding a valid UnionBank screenshot to `/screenshots` imports transaction
2. Adding a valid Metrobank screenshot to `/screenshots` imports transaction
3. Duplicate transactions are detected and skipped
4. Low-confidence parses are logged but not imported
5. OCR failures are logged and file moved to failed directory
6. Configuration is loaded from config.json
7. Pipeline runs continuously with file watcher

## Technical Stack

- Node.js 18+
- Tesseract.js 5.x
- @actual-app/api (or direct REST API)
- chokidar (file watcher)
- sharp (image preprocessing)
- crypto (hashing)

## File Structure

```
/screenshots          # Input directory
/screenshots/processed # Processed files
/screenshots/failed   # Failed files
/src
  /index.js         # Entry point
  /watcher.js      # File watcher
  /ocr.js         # Tesseract wrapper
  /parser.js       # Rule-based parser
  /actual.js       # Actual Budget API
  /confidence.js   # Confidence scorer
  /dedupe.js       # Deduplication
/config.json       # Configuration
/data
  /processed.json # Processed records
```