# Actual Budget Transaction Import Pipeline

## Project Overview

- **Project name**: actual-budget-import-pipeline
- **Type**: Node.js CLI automation tool
- **Core functionality**: Auto-import transactions from banking text (UnionBank + Metrobank PH) into self-hosted Actual Budget
- **Target users**: Self-hosted Actual Budget users in the Philippines

## Functionality Specification

### Core Features

#### 1. Text File Input
- Watches `text-input/unionbank/` and `text-input/metrobank/` directories for new `.txt` files
- Supported formats: plain text (copy-paste from online banking)

#### 2. Parsing Logic

##### UnionBank Format
- Transaction format: `MM/DD/YYYY | DESCRIPTION | PHP AMOUNT`
- Amount format: `1,234.56` (PHP assumed)

##### Metrobank Format
- Transaction format: `DESCRIPTION | MM/DD/YYYY | PHP AMOUNT`
- Amount format: `1,234.56` (PHP assumed)

#### 3. Category Mapping
Auto-categorize by payee name:
- `GRAB` → Transportation
- `STARBUCKS` → Food
- `SHOPEE` → Shopping
- `WATSONS` → Food
- `GLOBE` → Utilities

#### 4. Actual Budget Integration
- Uses `@actual-app/api` for self-hosted Actual Budget
- Maps accounts by name
- Converts PHP to milliunits (multiply by 100)
- Generates `imported_id` using SHA-256 hash of date + merchant + amount

#### 5. Deduplication
- Stores processed transaction hashes in `data/processed.json`
- Skips duplicates on re-import

## Acceptance Criteria

1. Adding a valid UnionBank text file to `text-input/unionbank/` imports transaction
2. Adding a valid Metrobank text file to `text-input/metrobank/` imports transaction
3. Duplicate transactions are detected and skipped
4. Category mapping works for known merchants
5. Configuration is loaded from config.json

## Technical Stack

- Node.js 18+
- @actual-app/api
- crypto (hashing)

## File Structure

```
/text-input
  /unionbank      # UnionBank transaction text
  /metrobank    # Metrobank transaction text
/src
  import-text.js # Entry point
  parse-text.js # Text parsers
  actual.js     # Actual Budget API
  dedupe.js     # Deduplication
/config.json    # Configuration (ignored)
/data
  processed.json # Processed records
```