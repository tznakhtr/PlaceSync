/**
 * Reusable CSV serialization and download utilities.
 * Protects against CSV Formula Injection and handles RFC 4180 escaping.
 */

/**
 * Sanitizes a single cell value to prevent CSV Formula Injection (Excel / Google Sheets execution).
 * If a cell value starts with '=', '+', '-', or '@' (after trimming), prefix it with a single quote.
 * Every field is wrapped in double quotes, with internal quotes escaped as '""'.
 */
export function sanitizeAndQuoteCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);
  const trimmed = str.trim();

  // Formula injection protection
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
  ) {
    str = `'${str}`;
  }

  // Escape internal double quotes per CSV standard
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts headers and row data into a well-formed CSV string.
 */
export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const headerLine = headers.map(sanitizeAndQuoteCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeAndQuoteCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers browser download of a generated CSV file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
