import { init, getCategories, downloadBudget, loadBudget } from '@actual-app/api';
import { loadConfig } from './constants.js';

const cfg = loadConfig();
const { serverUrl, password, syncId, budgetId } = cfg.actual;

await init({ serverURL: serverUrl, password });

if (syncId) await downloadBudget(syncId, { password });
if (budgetId) await loadBudget(budgetId);

const categories = await getCategories();
console.log(JSON.stringify(categories, null, 2));