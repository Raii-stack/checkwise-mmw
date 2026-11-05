import { describe, expect, it } from 'vitest';
import { checkDigit, passesChecksum, validateIdentifier } from './validation';

describe('Luhn arithmetic', () => {
  it('matches established check-digit examples', () => {
    expect(checkDigit('7992739871', 'luhn')).toBe('3');
    expect(passesChecksum('79927398713', 'luhn')).toBe(true);
    expect(passesChecksum('79927398714', 'luhn')).toBe(false);
    expect(checkDigit('12345', 'luhn')).toBe('5');
  });
  it('preserves leading zeros and handles repeated digits', () => {
    expect(passesChecksum('0000', 'luhn')).toBe(true);
    expect(passesChecksum('1115', 'luhn')).toBe(true);
    expect(passesChecksum('0', 'luhn')).toBe(false);
    expect(passesChecksum('0'.repeat(32), 'luhn')).toBe(true);
    expect(passesChecksum('0'.repeat(33), 'luhn')).toBe(false);
  });
  it('documents the undetected 09/90 adjacent swap', () => {
    expect(passesChecksum('109', 'luhn')).toBe(true);
    expect(passesChecksum('190', 'luhn')).toBe(true);
  });
});

describe('instructional mod-11', () => {
  it('uses 2–7 weights from the right and X for ten', () => {
    expect(checkDigit('123', 'mod11')).toBe('6');
    expect(checkDigit('6', 'mod11')).toBe('X');
    expect(passesChecksum('6X', 'mod11')).toBe(true);
    expect(passesChecksum('1236', 'mod11')).toBe(true);
    expect(checkDigit('1234567', 'mod11')).toBe('4');
    expect(passesChecksum('00', 'mod11')).toBe(true);
  });
  it('rejects misplaced or lowercase X and non-digit payloads', () => {
    for (const value of ['6x', 'X6', '12X6', '', 'X', ' 6X', '6-X']) expect(passesChecksum(value, 'mod11')).toBe(false);
    expect(() => checkDigit('', 'mod11')).toThrow();
  });
});

describe('classification', () => {
  it('returns no finding for a pass and format errors before arithmetic', () => {
    expect(validateIdentifier('79927398713', 'luhn')).toBeNull();
    expect(validateIdentifier('bad', 'luhn')?.code).toBe('invalid_format');
  });
  it('labels a repairable swap as possible without changing the original', () => {
    const value = '97927398713';
    const result = validateIdentifier(value, 'luhn');
    expect(result?.code).toBe('possible_transposition');
    expect(result?.swap_positions).toContain(1);
    expect(result?.message).toContain('not a confirmed correction');
    expect(value).toBe('97927398713');
  });
  it('keeps unknown causes unclassified', () => {
    expect(validateIdentifier('01', 'luhn')?.code).toBe('checksum_failed');
    expect(validateIdentifier('01', 'luhn')?.swap_positions).toEqual([]);
  });
});
