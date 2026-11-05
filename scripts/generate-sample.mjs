import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

const output = resolve('sample-data/checkwise-sample-1200.csv');
const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } });

try {
  const { sampleCsv } = await vite.ssrLoadModule('/src/lib/csv.ts');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${sampleCsv()}\n`, 'utf8');
} finally {
  await vite.close();
}
