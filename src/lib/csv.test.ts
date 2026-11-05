import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { HEADERS, MAX_BYTES, reportCsv, sampleCsv, validateCsv } from './csv';
const header = HEADERS.join(',');

describe('batch workflow', () => {
  it('processes 1,200 rows and retains only flagged records', () => {
    const run = validateCsv(sampleCsv(), 'sample.csv');
    expect(run.total_count).toBe(1200);
    expect(run.valid_count).toBe(900);
    expect(run.flagged_count).toBe(300);
    expect(run.transposition_count).toBeGreaterThanOrEqual(120);
    expect(run.errors).toHaveLength(run.flagged_count);
    expect(run.errors.some(row => row.code === 'invalid_format')).toBe(true);
    const exported = Papa.parse(reportCsv(run), { header: true });
    expect(exported.errors).toEqual([]);
    expect(exported.data).toHaveLength(run.flagged_count);
  });
  it('handles BOM, quoted commas, embedded newlines, blank lines and leading zeros', () => {
    const run = validateCsv(`\uFEFF${header}\r\n"INV, 1",luhn,0000\r\n\r\n"INV\n2",mod11,6X\nINV-3,luhn,`, 'quoted.csv');
    expect(run.total_count).toBe(3);
    expect(run.valid_count).toBe(2);
    expect(run.errors[0].row_number).toBe(4);
    expect(run.errors[0].code).toBe('invalid_format');
  });
  it('rejects malformed files without partially accepting records', () => {
    for (const csv of ['', header, 'wrong,columns,here\na,b,c', `${header}\n"unclosed,luhn,1`, `${header}\na,luhn,12,extra`, `${header}\na,luhn`]) expect(() => validateCsv(csv, 'bad.csv')).toThrow();
    expect(() => validateCsv('x'.repeat(MAX_BYTES + 1), 'big.csv')).toThrow('2 MB');
    expect(() => validateCsv(`${header}\n${'a,luhn,00\n'.repeat(5001)}`, 'many.csv')).toThrow('5,000');
    expect(() => validateCsv(`${header}\n${'a'.repeat(81)},luhn,00`, 'long.csv')).toThrow('field length');
  });
  it('requires invoice IDs and known methods', () => {
    const run = validateCsv(`${header}\n,luhn,00\na,tin,00`, 'bad.csv');
    expect(run.errors.map(e => e.code)).toEqual(['invalid_format', 'invalid_format']);
  });
  it('protects spreadsheet exports from formula injection', () => {
    const run = validateCsv(`${header}\n=HYPERLINK(1),luhn,+123`, 'formulas.csv');
    const rows = Papa.parse<string[]>(reportCsv(run)).data;
    expect(rows[1][1]).toBe("'=HYPERLINK(1)");
    expect(rows[1][3]).toBe("'+123");
  });
  it('exports a valid header-only report for clean batches', () => {
    const report = reportCsv(validateCsv(`${header}\na,luhn,00`, 'clean.csv'));
    expect(report).toContain('row_number,invoice_id');
    expect(Papa.parse(report, { skipEmptyLines: true }).data).toHaveLength(1);
  });
});
