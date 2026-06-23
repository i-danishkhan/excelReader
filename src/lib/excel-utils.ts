import * as XLSX from "xlsx";

export type CellValue = string | number | boolean | Date | null;

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: CellValue[][];
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[];
}

export type ColumnType = "number" | "date" | "boolean" | "text" | "empty";

export interface ColumnStats {
  total: number;
  unique: number;
  empty: number;
  type: ColumnType;
  min?: number;
  max?: number;
  avg?: number;
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json<CellValue[]>(ws, {
      header: 1,
      blankrows: false,
      defval: null,
      raw: true,
    });
    if (aoa.length === 0) return { name, headers: [], rows: [] };
    const headers = (aoa[0] as CellValue[]).map((h, i) =>
      h === null || h === undefined || h === "" ? `Column ${i + 1}` : String(h),
    );
    const rows = aoa.slice(1).map((row) => {
      const r = [...row];
      while (r.length < headers.length) r.push(null);
      return r.slice(0, headers.length);
    });
    return { name, headers, rows };
  });
  return { sheets };
}

export function getColumnValues(sheet: ParsedSheet, colIndex: number): CellValue[] {
  return sheet.rows.map((r) => (r[colIndex] === undefined ? null : r[colIndex]));
}

export function computeStats(values: CellValue[]): ColumnStats {
  const total = values.length;
  let empty = 0;
  const seen = new Set<string>();
  const numbers: number[] = [];
  let nonEmptyCount = 0;
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === "") {
      empty++;
      continue;
    }
    nonEmptyCount++;
    seen.add(String(v));
    if (typeof v === "number" && !Number.isNaN(v)) {
      numbers.push(v);
      numCount++;
    } else if (typeof v === "boolean") {
      boolCount++;
    } else if (v instanceof Date) {
      dateCount++;
    } else if (typeof v === "string") {
      const d = Date.parse(v);
      if (!Number.isNaN(d) && /\d{4}/.test(v) && /[-/:]/.test(v)) dateCount++;
    }
  }

  let type: ColumnType = "text";
  if (nonEmptyCount === 0) type = "empty";
  else if (numCount === nonEmptyCount) type = "number";
  else if (boolCount === nonEmptyCount) type = "boolean";
  else if (dateCount === nonEmptyCount) type = "date";

  const stats: ColumnStats = { total, unique: seen.size, empty, type };
  if (numbers.length > 0) {
    stats.min = Math.min(...numbers);
    stats.max = Math.max(...numbers);
    stats.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  return stats;
}

export function formatCell(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v);
}

export function exportColumnCSV(header: string, values: CellValue[]): Blob {
  const lines = [csvEscape(header), ...values.map((v) => csvEscape(formatCell(v)))];
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}

export function exportColumnXLSX(header: string, values: CellValue[]): Blob {
  const ws = XLSX.utils.aoa_to_sheet([[header], ...values.map((v) => [formatCell(v)])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, header.slice(0, 30) || "Column");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
