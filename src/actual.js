import pkg from '@actual-app/api';
const { init, getAccounts, getCategories, addTransactions, downloadBudget, loadBudget } = pkg;
import { loadConfig } from './constants.js';

let initialized = false;
let apiConfig = null;
let categoryCache = null;

async function ensureInitialized() {
  if (initialized) return;
  
  apiConfig = loadConfig();
  const { serverUrl, password, syncId, budgetId } = apiConfig.actual;
  
  await init({ serverURL: serverUrl, password });
  
  if (syncId) {
    await downloadBudget(syncId, { password });
  }
  if (budgetId) {
    await loadBudget(budgetId);
  }
  
  const categories = await getCategories();
  categoryCache = categories.reduce((acc, c) => {
    acc[c.name.toLowerCase()] = c.id;
    return acc;
  }, {});
  
  initialized = true;
}

export async function getAccountsList() {
  await ensureInitialized();
  return await getAccounts();
}

export function getCategoryId(merchant) {
  if (!merchant || !categoryCache) return null;
  
  const merchantLower = merchant.toLowerCase();
  const cfg = loadConfig();
  const mapping = cfg.categories || {};
  
  for (const [key, categoryName] of Object.entries(mapping)) {
    if (merchantLower.includes(key.toLowerCase())) {
      return categoryCache[categoryName?.toLowerCase()];
    }
  }
  return null;
}

export async function createTransaction(accountId, transaction) {
  await ensureInitialized();
  
  const categoryId = getCategoryId(transaction.payee);
  
  const payload = {
    account: accountId,
    date: transaction.date,
    amount: Math.round(transaction.amount * 100),
    payee_name: transaction.payee,
    cleared: transaction.cleared || false,
    imported_id: transaction.imported_id
  };
  
  if (categoryId) {
    payload.category = categoryId;
  }

  console.log('[ACTUAL] Creating transaction:', JSON.stringify(payload, null, 2));

  const result = await addTransactions(accountId, [payload]);
  console.log('[ACTUAL] Result:', result);
  
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
  await ensureInitialized();
  
  const accounts = await getAccountsList();
  const accountId = mapAccount(accounts, accountName);

  if (!accountId) {
    throw new Error(`No account mapping found for: ${accountName}`);
  }

  return await createTransaction(accountId, transactionData);
}