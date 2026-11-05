import { validateCsv } from './lib/csv';

self.onmessage = async (event: MessageEvent<{ file?: File; text?: string; name: string }>) => {
  try {
    const text = event.data.file ? await event.data.file.text() : event.data.text || '';
    self.postMessage({ run: validateCsv(text, event.data.name) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unable to read this CSV.' });
  }
};
