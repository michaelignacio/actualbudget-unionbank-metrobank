import chokidar from 'chokidar';
import fs from 'fs';
import { SCREENSHOTS_DIR } from './constants.js';

import { processFile } from './index.js';

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const DEBOUNCE_MS = 1000;

let watcher = null;
let pendingFiles = new Map();

function debounceProcess(filePath, callback) {
  if (pendingFiles.has(filePath)) {
    clearTimeout(pendingFiles.get(filePath));
  }
  
  const timeout = setTimeout(() => {
    pendingFiles.delete(filePath);
    callback();
  }, DEBOUNCE_MS);
  
  pendingFiles.set(filePath, timeout);
}

function isReady(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return false;
    
    const content = fs.readFileSync(filePath);
    if (!content || content.length < 100) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

export function startWatcher() {
  console.log(`[WATCHER] Starting file watcher on ${SCREENSHOTS_DIR}`);
  
  watcher = chokidar.watch(SCREENSHOTS_DIR, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const ext = require('path').extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return;
    }

    console.log(`[WATCHER] New file detected: ${require('path').basename(filePath)}`);
    
    debounceProcess(filePath, async () => {
      if (!isReady(filePath)) {
        console.log(`[WATCHER] File not ready, waiting...`);
        setTimeout(() => processFile(filePath), 2000);
        return;
      }

      await processFile(filePath);
    });
  });

  watcher.on('error', (error) => {
    console.error(`[WATCHER] Error: ${error}`);
  });

  console.log(`[WATCHER] Watching for changes...`);
}

export function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  
  for (const timeout of pendingFiles.values()) {
    clearTimeout(timeout);
  }
  pendingFiles.clear();
  
  console.log(`[WATCHER] Stopped`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startWatcher();
  
  process.on('SIGINT', () => {
    console.log('\n[WATCHER] Shutting down...');
    stopWatcher();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopWatcher();
    process.exit(0);
  });
}