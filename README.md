# Actual UnionBank Metrobank

Auto-import transactions from UnionBank and Metrobank (Philippines) into self-hosted Actual Budget.

## Setup

```bash
npm install
```

## Configuration

Copy `config.json.sample` to `config.json` and fill in your Actual Budget details:

```json
{
  "serverUrl": "http://localhost:3006",
  "password": "your-password",
  "accounts": {
    "UnionBank Main": "881465e3-959f-464e-8f96-9529e899e202",
    "Metrobank Savings": "81250584-52de-4cac-b31a-6229a0188594"
  },
  "categories": {
    "grab": "89d581ba-be57-4fe2-a0bd-8c26f49ef8db",
    "food": "541836f1-e756-4473-a5d0-6c1d3f06c7fa",
    "shopping": "af375fd4-d759-46b3-bffe-74a856151d57",
    "utilities": "d4b0f075-3343-4408-91ed-fae94f74e5bf"
  }
}
```

Get account/category IDs from Actual Budget's developer tools (Settings → Advanced → API).

## Usage

### Import Transactions

Copy-paste your transaction history from your online banking account and save as `.txt` files in:
- `text-input/unionbank/` - UnionBank transaction text
- `text-input/metrobank/` - Metrobank transaction text

Run import:

```bash
node src/import-text.js
```

### Text Formats

Copy-paste from your online banking account:

**UnionBank**:
```
MM/DD/YYYY | DESCRIPTION | PHP 1,234.56
```

**Metrobank**:
```
DESCRIPTION | MM/DD/YYYY | PHP 1,234.56
```

### Delete All Transactions

```bash
node src/delete-all.js
```

### Clear Deduplication Cache

```bash
rm data/processed.json
```

## Files

- `src/import-text.js` - Main import script
- `src/parse-text.js` - Text parsers
- `src/actual.js` - Actual Budget API
- `src/dedupe.js` - SHA-256 deduplication
- `config.json` - Your credentials (ignored by git)