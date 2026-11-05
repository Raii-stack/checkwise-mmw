import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import writeXlsxFile from 'write-excel-file/node';

const csv = await readFile(resolve('sample-data/checkwise-sample-1200.csv'), 'utf8');
const lines = csv.trim().split(/\r?\n/).filter(Boolean);
const rows = lines.map(line => line.split(',').map(val => ({ value: val.trim(), type: String })));

// Full 1,200 batch
const fullFile = await writeXlsxFile(rows, { buffer: true });
await writeFile(resolve('sample-data/checkwise-sample-1200.xlsx'), await fullFile.toBuffer());

// Concise 15-record batch for quick inspection
const quickRows = rows.slice(0, 16);
const quickFile = await writeXlsxFile(quickRows, { buffer: true });
await writeFile(resolve('sample-data/checkwise-sample-quick.xlsx'), await quickFile.toBuffer());

console.log('Sample Excel files created successfully.');
