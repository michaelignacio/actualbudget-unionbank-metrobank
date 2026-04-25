import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export const PROJECT_ROOT = '/Users/michael/Sites/personal/actualbudget-extension';
export const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'screenshots');
export const PROCESSED_DIR = path.join(PROJECT_ROOT, 'screenshots/processed');
export const FAILED_DIR = path.join(PROJECT_ROOT, 'screenshots/failed');
export const CONFIG_FILE = path.join(PROJECT_ROOT, 'config.json');
export const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const PROCESSED_FILE = path.join(DATA_DIR, 'processed.json');
export const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

let config = null;

export function loadConfig() {
  if (!config) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(raw);
  }
  return config;
}