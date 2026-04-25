import pkg from '@actual-app/api';
const { init, getAccounts, getTransactions, deleteTransaction, downloadBudget, loadBudget } = pkg;
import { loadConfig } from './constants.js';

const cfg = loadConfig();
const { serverUrl, password, syncId, budgetId } = cfg.actual;

await init({ serverURL: serverUrl, password });

if (syncId) await downloadBudget(syncId, { password });
if (budgetId) await loadBudget(budgetId);

const accounts = await getAccounts();
console.log('Available accounts:');
accounts.forEach(a => console.log(`  - ${a.name}: ${a.id}`));

const metrobank = accounts.find(a => a.name.toLowerCase().includes('metrobank'));
const unionbank = accounts.find(a => a.name.toLowerCase().includes('union') || a.name.toLowerCase().includes('ub'));

async function deleteAll(accountId, accountName) {
  console.log(`\nFetching transactions for ${accountName}...`);
  const txs = await getTransactions(accountId);
  console.log(`Found ${txs.length} transactions`);
  
  if (txs.length > 0) {
    for (const tx of txs) {
      await deleteTransaction(tx.id);
    }
    console.log(`Deleted ${txs.length} transactions`);
  }
}

if (metrobank) await deleteAll(metrobank.id, metrobank.name);
if (unionbank) await deleteAll(unionbank.id, unionbank.name);

console.log('\nDone.');
setTimeout(() => process.exit(0), 1000);

setTimeout(() => {
  console.log('Timeout - exiting');
  process.exit(0);
}, 60000);