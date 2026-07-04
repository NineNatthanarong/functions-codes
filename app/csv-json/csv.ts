/**
 * Minimal, correct CSV utilities for the CSV <-> JSON tool.
 * Hand-rolled RFC 4180-style parser: quoted fields, escaped quotes (""),
 * delimiters/newlines inside quotes, CRLF — with row/column error reporting.
 */

export type CsvErrorCode = 'unclosed-quote' | 'after-quote';

export type CsvError = {
  /** 1-based physical line in the input */
  row: number;
  /** 1-based column in that line */
  col: number;
  code: CsvErrorCode;
};

export type CsvParseResult = {
  rows: string[][];
  error: CsvError | null;
};

export function parseCsv(text: string, delimiter: string): CsvParseResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  let line = 1;
  let col = 1;
  let quoteLine = 1;
  let quoteCol = 1;
  // True once the current record has real content — e.g. a quoted (possibly
  // empty) field — so the EOF flush can tell a final `""` record apart from
  // the phantom empty record after a trailing newline.
  let recordHasContent = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
    recordHasContent = false;
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // escaped quote
          field += '"';
          i += 2;
          col += 2;
          continue;
        }
        // closing quote — next char must be delimiter, newline, or EOF
        inQuotes = false;
        i += 1;
        col += 1;
        const next = text[i];
        if (next !== undefined && next !== delimiter && next !== '\n' && next !== '\r') {
          return { rows, error: { row: line, col, code: 'after-quote' } };
        }
        continue;
      }
      if (ch === '\n') {
        field += ch;
        line += 1;
        col = 1;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      col += 1;
      continue;
    }

    if (ch === '"' && field === '') {
      inQuotes = true;
      recordHasContent = true;
      quoteLine = line;
      quoteCol = col;
      i += 1;
      col += 1;
      continue;
    }
    if (ch === delimiter) {
      pushField();
      i += 1;
      col += 1;
      continue;
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1; // CRLF
      pushRow();
      line += 1;
      col = 1;
      i += 1;
      continue;
    }
    if (ch === '\n') {
      pushRow();
      line += 1;
      col = 1;
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
    col += 1;
  }

  if (inQuotes) {
    return { rows, error: { row: quoteLine, col: quoteCol, code: 'unclosed-quote' } };
  }
  // flush the last record (skip the empty record produced by a trailing newline)
  if (field !== '' || row.length > 0 || recordHasContent) pushRow();

  return { rows, error: null };
}

/** Render any cell value as display text (objects/arrays JSON-stringified). */
export function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'number' || typeof cell === 'boolean') return String(cell);
  const json = JSON.stringify(cell);
  return typeof json === 'string' ? json : '';
}

/** Serialize rows to CSV with proper quoting. Records joined with CRLF. */
export function toCsv(rows: unknown[][], delimiter: string): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cellToString(cell);
          const needsQuote =
            text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r');
          return needsQuote ? '"' + text.replace(/"/g, '""') + '"' : text;
        })
        .join(delimiter)
    )
    .join('\r\n');
}

/**
 * Try to coerce a CSV cell into number/boolean.
 * Leaves leading-zero digit strings (e.g. Thai phone numbers "0812345678") as strings.
 */
export function coerceValue(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (trimmed === '') return value;
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  if (/^-?0\d/.test(trimmed)) return value; // keep leading zeros (IDs, phone numbers)
  if (/^-?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isFinite(n)) return n;
  }
  return value;
}

export type JsonShapeError = 'not-array' | 'empty-array' | 'mixed-items';

export type JsonTable = {
  /** Column names (union of object keys) or null for array-of-arrays input */
  header: string[] | null;
  rows: unknown[][];
};

export type JsonTableResult = { table: JsonTable } | { shapeError: JsonShapeError };

/**
 * Shape a parsed JSON value into a table.
 * Accepts an array of objects (union of keys -> columns) or an array of arrays.
 */
export function jsonToTable(value: unknown): JsonTableResult {
  if (!Array.isArray(value)) return { shapeError: 'not-array' };
  if (value.length === 0) return { shapeError: 'empty-array' };

  if (value.every((item) => Array.isArray(item))) {
    return { table: { header: null, rows: value as unknown[][] } };
  }

  const allObjects = value.every(
    (item) => item !== null && typeof item === 'object' && !Array.isArray(item)
  );
  if (!allObjects) return { shapeError: 'mixed-items' };

  const keySet = new Set<string>();
  for (const item of value as Record<string, unknown>[]) {
    for (const key of Object.keys(item)) keySet.add(key);
  }
  const header = Array.from(keySet);
  const rows = (value as Record<string, unknown>[]).map((item) => header.map((key) => item[key]));
  return { table: { header, rows } };
}
