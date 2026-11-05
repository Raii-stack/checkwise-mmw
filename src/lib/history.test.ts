import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteRun, getRun, listRuns, saveRun } from './history';
import { sampleCsv, validateCsv } from './csv';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('browser history', () => {
  it('persists summaries and errors, supports reopening, retries and deletion', async () => {
    const run = validateCsv(sampleCsv(), 'sample.csv');
    await saveRun(run);
    await saveRun(run);
    expect(await getRun(run.id)).toEqual(run);
    const listing = await listRuns(0);
    expect(listing.runs).toHaveLength(1);
    expect(listing.runs[0]).not.toHaveProperty('errors');
    expect(listing.runs[0].flagged_count).toBe(300);
    await deleteRun(run.id);
    expect((await listRuns(0)).runs).toHaveLength(0);
    await expect(getRun(run.id)).rejects.toThrow('no longer saved');
  });
  it('paginates newest-first without losing records', async () => {
    const runs = Array.from({ length: 23 }, (_, index) => ({ ...validateCsv('invoice_id,identifier_type,identifier_value\na,luhn,00', `${index}.csv`), created_at: new Date(1700000000000 + index * 1000).toISOString() }));
    for (const run of runs) await saveRun(run);
    const first = await listRuns(0);
    const second = await listRuns(1);
    expect(first.runs).toHaveLength(20);
    expect(first.hasMore).toBe(true);
    expect(second.runs).toHaveLength(3);
    expect(second.hasMore).toBe(false);
    expect([...first.runs, ...second.runs].map(row => row.id)).toEqual([...runs].reverse().map(row => row.id));
    for (const run of runs) await deleteRun(run.id);
  });
  it('reports unavailable storage without pretending a save succeeded', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(saveRun(validateCsv(sampleCsv(), 'sample.csv'))).rejects.toThrow('cannot save history');
  });
  it('reports failed transactions so an export remains possible', async () => {
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
      const request = original.call(this, value, key);
      this.transaction.abort();
      return request;
    });
    await expect(saveRun(validateCsv(sampleCsv(), 'sample.csv'))).rejects.toThrow('could not be saved');
  });
});
