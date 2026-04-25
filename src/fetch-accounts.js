import pkg from '@actual-app/api';
const { init, getAccounts, downloadBudget, loadBudget } = pkg;
import { loadConfig } from './actual.js';

async function fetchAccounts() {
  const cfg = loadConfig();
  const { serverUrl, password, syncId, budgetId } = cfg.actual;
  
  console.log('=== FETCHING ACCOUNTS ===\n');
  console.log('Server:', serverUrl);
  console.log('Sync ID:', syncId);
  
  try {
    await init({ serverURL: serverUrl, password });
    console.log('Connected!\n');
    
    // Download budget first
    console.log('Downloading budget...');
    await downloadBudget(syncId, { password });
    console.log('Downloaded!\n');
    
    // Load budget
    console.log('Loading budget...');
    await loadBudget(budgetId);
    console.log('Loaded!\n');
    
    const accounts = await getAccounts();
    console.log('=== ACCOUNTS ===');
    console.log('{');
    accounts.forEach(a => {
      console.log(`  "${a.name}": "${a.id}",`);
    });
    console.log('}');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

fetchAccounts();