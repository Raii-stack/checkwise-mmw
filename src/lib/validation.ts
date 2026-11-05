export type Scheme = 'luhn' | 'mod11';
export type FindingCode = 'invalid_format' | 'checksum_failed' | 'possible_transposition';
export interface Finding {
  row_number: number;
  invoice_id: string;
  identifier_type: string;
  identifier_value: string;
  code: FindingCode;
  message: string;
  swap_positions: number[];
}
export interface Run {
  id: string;
  created_at: string;
  file_name: string;
  total_count: number;
  valid_count: number;
  flagged_count: number;
  transposition_count: number;
  algorithm_version: 1;
  errors: Finding[];
}
export type RunSummary = Omit<Run, 'errors'>;

export function checkDigit(payload: string, scheme: Scheme): string {
  if (!/^\d{1,31}$/.test(payload)) throw new Error('Use 1–31 digits for the payload.');
  let sum = 0;
  for (let offset = 0; offset < payload.length; offset++) {
    const digit = Number(payload[payload.length - 1 - offset]);
    if (scheme === 'luhn') {
      const weighted = offset % 2 === 0 ? digit * 2 : digit;
      sum += weighted > 9 ? weighted - 9 : weighted;
    } else {
      sum += digit * (2 + offset % 6);
    }
  }
  const check = scheme === 'luhn' ? (10 - sum % 10) % 10 : (11 - sum % 11) % 11;
  return check === 10 ? 'X' : String(check);
}

export function hasValidFormat(value: string, scheme: Scheme): boolean {
  return scheme === 'luhn' ? /^\d{2,32}$/.test(value) : /^\d{1,31}[\dX]$/.test(value);
}

export function passesChecksum(value: string, scheme: Scheme): boolean {
  return hasValidFormat(value, scheme) && checkDigit(value.slice(0, -1), scheme) === value.at(-1);
}

export function validateIdentifier(value: string, scheme: Scheme): Pick<Finding, 'code' | 'message' | 'swap_positions'> | null {
  if (!hasValidFormat(value, scheme)) return {
    code: 'invalid_format', swap_positions: [],
    message: scheme === 'luhn' ? 'Luhn needs 2–32 digits, including the final check digit.' : 'Mod-11 needs 1–31 payload digits and a final digit or uppercase X.',
  };
  if (passesChecksum(value, scheme)) return null;
  const positions: number[] = [];
  for (let index = 0; index < value.length - 1; index++) {
    // Equal digits do not change the identifier; X is not a digit to transpose.
    if (value[index] === value[index + 1] || !/^\d\d$/.test(value.slice(index, index + 2))) continue;
    const swapped = value.slice(0, index) + value[index + 1] + value[index] + value.slice(index + 2);
    if (passesChecksum(swapped, scheme)) positions.push(index + 1);
  }
  return positions.length ? {
    code: 'possible_transposition', swap_positions: positions,
    message: `Swapping positions ${positions.map(p => `${p}–${p + 1}`).join(', ')} passes the checksum. This is a possibility, not a confirmed correction.`,
  } : {
    code: 'checksum_failed', swap_positions: [],
    message: `Checksum failed. For this unchanged payload, the expected check digit is ${checkDigit(value.slice(0, -1), scheme)}. The cause is unknown.`,
  };
}
