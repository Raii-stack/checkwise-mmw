import Papa from 'papaparse';
import { checkDigit, validateIdentifier, type Finding, type Run, type Scheme } from './validation';

export const HEADERS = ['invoice_id', 'identifier_type', 'identifier_value'];
export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;

export function validateCsv(text: string, fileName: string): Run {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Choose a CSV smaller than 2 MB.');
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const parsed = Papa.parse<string[]>(normalized, { skipEmptyLines: 'greedy', delimiter: ',', newline: '\n' });
  if (parsed.errors.length) throw new Error(`CSV could not be read: ${parsed.errors[0].message}`);
  const [header, ...rows] = parsed.data;
  if (!header || header.length !== HEADERS.length || HEADERS.some((name, i) => header[i].trim() !== name)) {
    throw new Error(`Use these exact columns, in order: ${HEADERS.join(',')}`);
  }
  if (!rows.length) throw new Error('The CSV contains a header but no records.');
  if (rows.length > MAX_ROWS) throw new Error(`Use at most ${MAX_ROWS.toLocaleString()} records per batch.`);
  const errors: Finding[] = [];
  rows.forEach((row, index) => {
    if (row.length !== 3) throw new Error(`CSV record ${index + 2} has ${row.length} columns; expected 3. Check commas and quotation marks.`);
    const [invoice_id, identifier_type, identifier_value] = row.map(value => value.trim());
    if (invoice_id.length > 80 || identifier_type.length > 32 || identifier_value.length > 128) {
      throw new Error(`CSV record ${index + 2} exceeds the field length limit (80 / 32 / 128 characters).`);
    }
    const base = { row_number: index + 2, invoice_id, identifier_type, identifier_value };
    if (!invoice_id || !['luhn', 'mod11'].includes(identifier_type)) {
      errors.push({ ...base, code: 'invalid_format', swap_positions: [], message: !invoice_id ? 'Invoice ID is required.' : 'Identifier type must be luhn or mod11.' });
      return;
    }
    const finding = validateIdentifier(identifier_value, identifier_type as Scheme);
    if (finding) errors.push({ ...base, ...finding });
  });
  return {
    id: crypto.randomUUID(), created_at: new Date().toISOString(), file_name: fileName.slice(0, 160),
    total_count: rows.length, valid_count: rows.length - errors.length, flagged_count: errors.length,
    transposition_count: errors.filter(row => row.code === 'possible_transposition').length,
    algorithm_version: 1, errors,
  };
}

export function sampleCsv(): string {
  const rows = Array.from({ length: 1200 }, (_, i) => {
    const scheme: Scheme = i % 2 === 0 ? 'luhn' : 'mod11';
    const payload = String(8100000 + i);
    let value = payload + checkDigit(payload, scheme);
    if (i % 10 === 0) value = value.slice(1, 2) + value[0] + value.slice(2);
    else if (i % 10 === 1) value = payload + ((Number(value.at(-1)) || 0) + 1) % 10;
    else if (i % 20 === 2) value = 'MISSING';
    return [`DEMO-${String(i + 1).padStart(4, '0')}`, scheme, value];
  });
  return Papa.unparse([HEADERS, ...rows]);
}

export function reportCsv(run: Run): string {
  return Papa.unparse({
    fields: ['row_number', 'invoice_id', 'identifier_type', 'identifier_value', 'finding', 'explanation', 'possible_swap_positions'],
    data: run.errors.map(row => [row.row_number, row.invoice_id, row.identifier_type, row.identifier_value, row.code, row.message, row.swap_positions.map(p => `${p}-${p + 1}`).join('; ')]),
  }, { escapeFormulae: true });
}

export function downloadCsv(content: string, name: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
