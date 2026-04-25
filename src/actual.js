import fs from 'fs';
import { CONFIG_FILE } from './constants.js';

let config = null;

export function loadConfig() {
  if (!config) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(raw);
  }
  return config;
}

export async function fetchAccounts() {
  const cfg = loadConfig();
  const { serverUrl, password, encryptionKey } = cfg.actual;

  const response = await fetch(`${serverUrl}/api/budgets`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${password}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch budgets: ${response.status}`);
  }

  const data = await response.json();
  return data.budgets || [];
}

export async function getAccounts(budgetId) {
  const cfg = loadConfig();
  const { serverUrl, password } = cfg.actual;

  const response = await fetch(`${serverUrl}/api/budget/${budgetId}/accounts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${password}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.status}`);
  }

  const data = await response.json();
  return data || [];
}

export async function createTransaction(budgetId, accountId, transaction) {
  const cfg = loadConfig();
  const { serverUrl, password } = cfg.actual;

  const payload = {
    account: accountId,
    date: transaction.date,
    amount: -transaction.amount * 1000,
    payee: transaction.payee,
    notes: transaction.notes || '',
    cleared: transaction.cleared || false,
    imported_id: transaction.imported_id,
    flags: 0
  };

  console.log('[ACTUAL] Creating transaction:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${serverUrl}/api/budget/${budgetId}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${password}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create transaction: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log('[ACTUAL] Transaction created:', result.id);
  return result;
}

export function mapAccount(accounts, accountName) {
  const cfg = loadConfig();
  const mapping = cfg.accounts?.mapping || {};

  if (mapping[accountName]) {
    return mapping[accountName];
  }

  const found = accounts.find(
    a => a.name.toLowerCase() === accountName.toLowerCase() ||
         a.name.toLowerCase().includes(accountName.toLowerCase())
  );

  return found?.id || null;
}

export async function importTransaction(transactionData, accountName) {
  const cfg = loadConfig();
  const budgetId = cfg.actual.budgetId || 'default';

  const accounts = await getAccounts(budgetId);
  const accountId = mapAccount(accounts, accountName);

  if (!accountId) {
    throw new Error(`No account mapping found for: ${accountName}`);
  }

  const txWithAccount = {
    ...transactionData,
    accountId
  };

  return await createTransaction(budgetId, accountId, txWithAccount);
}