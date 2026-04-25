import { init, getAccounts, downloadBudget, loadBudget } from '@actual-app/api';
import { loadConfig } from './constants.js';

async function main() {
  const config = loadConfig();
  const { serverUrl, password, syncId, budgetId } = config.actual;

  console.log(`Connecting to: ${serverUrl}`);
  
  await init({ serverURL: serverUrl, password });

  if (syncId) {
    console.log('Downloading budget...');
    await downloadBudget(syncId, { password });
  }
  
  if (budgetId) {
    console.log('Loading budget...');
    await loadBudget(budgetId);
  }

  const accounts = await getAccounts();
  
  console.log('\n--- Accounts ---');
  accounts.forEach(a => {
    console.log(`"${a.name}": "${a.id}"`);
  });
}

main().catch(console.error);