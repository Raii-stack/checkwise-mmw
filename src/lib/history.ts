import type { Run, RunSummary } from './validation';

const DB_NAME = 'checkwise-history';
const STORE = 'runs';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('This browser cannot save history. Export your report instead.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('created_at', ['created_at', 'id']);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Browser storage is unavailable. Export your report or check browser permissions.'));
    request.onblocked = () => reject(new Error('Close other Checkwise tabs and try saving again.'));
  });
}

export async function saveRun(run: Run): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(run);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = () => { db.close(); reject(new Error('History could not be saved. Browser storage may be full or disabled. Export your report, or delete older saved runs and retry.')); };
  });
}

export async function getRun(id: string): Promise<Run> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(id);
    transaction.oncomplete = () => {
      db.close();
      if (request.result) resolve(request.result as Run);
      else reject(new Error('This run is no longer saved in this browser.'));
    };
    transaction.onabort = () => { db.close(); reject(new Error('Unable to read browser history. Please try again.')); };
  });
}

export async function listRuns(page: number): Promise<{ runs: RunSummary[]; hasMore: boolean }> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).index('created_at').openCursor(null, 'prev');
    const summaries: RunSummary[] = [];
    let skipped = page === 0;
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (!skipped) { skipped = true; cursor.advance(page * 20); return; }
      const { errors: _errors, ...summary } = cursor.value as Run;
      summaries.push(summary);
      if (summaries.length <= 20) cursor.continue();
    };
    transaction.oncomplete = () => { db.close(); resolve({ runs: summaries.slice(0, 20), hasMore: summaries.length > 20 }); };
    transaction.onabort = () => { db.close(); reject(new Error('Unable to load browser history. Please try again.')); };
  });
}

export async function deleteRun(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = () => { db.close(); reject(new Error('Unable to delete this run. Please try again.')); };
  });
}
