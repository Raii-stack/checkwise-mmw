import { validateCsv, validateXlsx } from './lib/csv';

self.onmessage = async (event: MessageEvent<{ file?: File; text?: string; name: string }>) => {
  try {
    const { file, text, name } = event.data;
    const lower = name.toLowerCase();
    if (lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
      throw new Error('Legacy Excel .xls files are not supported. Please save as .xlsx or .csv.');
    }
    const isXlsx = lower.endsWith('.xlsx') || file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (isXlsx) {
      if (!file) throw new Error('No Excel file content received.');
      const buffer = await file.arrayBuffer();
      self.postMessage({ run: await validateXlsx(buffer, name) });
    } else {
      const content = file ? await file.text() : text || '';
      self.postMessage({ run: validateCsv(content, name) });
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unable to read this file.' });
  }
};
