// ============================================================
// EXCEL / CSV PARSER UTILITY
// Client-side parsing using xlsx and papaparse
// Supports Arabic column names and RTL data
// ============================================================

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  fileName: string;
  sheetName?: string;
}

export interface ColumnInfo {
  name: string;
  type: 'text' | 'number' | 'date' | 'mixed';
  sampleValues: any[];
  uniqueCount: number;
  emptyCount: number;
  isNumeric: boolean;
}

/**
 * Parse an Excel (.xlsx/.xls) or CSV file and return structured data
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'tsv') {
    return parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error(`نوع الملف غير مدعوم: ${ext}. يرجى رفع ملف Excel (.xlsx) أو CSV.`);
  }
}

/**
 * Parse Excel file using xlsx library
 */
export async function parseExcel(file: File, sheetIndex: number = 0): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (jsonData.length === 0) {
          reject(new Error('الملف فارغ أو لا يحتوي على بيانات'));
          return;
        }

        const headers = Object.keys(jsonData[0]);

        resolve({
          headers,
          rows: jsonData,
          totalRows: jsonData.length,
          fileName: file.name,
          sheetName,
        });
      } catch (error: any) {
        reject(new Error(`خطأ في قراءة ملف Excel: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file using papaparse
 */
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parse warnings:', results.errors);
        }

        if (!results.data || results.data.length === 0) {
          reject(new Error('الملف فارغ أو لا يحتوي على بيانات'));
          return;
        }

        const headers = results.meta.fields || Object.keys(results.data[0] as Record<string, any>);

        resolve({
          headers,
          rows: results.data as Record<string, any>[],
          totalRows: results.data.length,
          fileName: file.name,
        });
      },
      error: (error) => {
        reject(new Error(`خطأ في قراءة ملف CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Analyze columns to determine their types and statistics
 */
export function analyzeColumns(data: ParsedData): ColumnInfo[] {
  return data.headers.map(header => {
    const values = data.rows.map(row => row[header]);
    const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
    const numericValues = nonEmpty.filter(v => !isNaN(Number(v)) && v !== '');
    const isNumeric = numericValues.length > nonEmpty.length * 0.7; // 70% threshold

    let type: ColumnInfo['type'] = 'text';
    if (isNumeric) {
      type = 'number';
    } else {
      // Check for date patterns
      const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/;
      const dateValues = nonEmpty.filter(v => datePattern.test(String(v)));
      if (dateValues.length > nonEmpty.length * 0.7) {
        type = 'date';
      }
    }

    const uniqueValues = new Set(nonEmpty.map(String));

    return {
      name: header,
      type,
      sampleValues: nonEmpty.slice(0, 5),
      uniqueCount: uniqueValues.size,
      emptyCount: values.length - nonEmpty.length,
      isNumeric,
    };
  });
}

/**
 * Calculate statistics for numeric columns
 */
export function calculateColumnStats(values: number[]): {
  count: number;
  sum: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  passCount: number;
  failCount: number;
  passRate: number;
} {
  if (values.length === 0) {
    return { count: 0, sum: 0, average: 0, median: 0, min: 0, max: 0, stdDev: 0, passCount: 0, failCount: 0, passRate: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  const passCount = values.filter(v => v >= 60).length;

  return {
    count: values.length,
    sum: Math.round(sum * 100) / 100,
    average: Math.round(avg * 100) / 100,
    median: sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    passCount,
    failCount: values.length - passCount,
    passRate: Math.round((passCount / values.length) * 100 * 100) / 100,
  };
}

/**
 * Generate a sample CSV template for download
 */
export function generateSampleCSV(fields: Array<{ id: string; label_ar: string }>): string {
  const headers = fields.map(f => f.label_ar).join(',');
  const sampleRow = fields.map(f => `مثال_${f.label_ar}`).join(',');
  return `\ufeff${headers}\n${sampleRow}`;
}

/**
 * Generate a sample Excel template for download
 */
export function generateSampleExcel(fields: Array<{ id: string; label_ar: string }>): Blob {
  const ws = XLSX.utils.aoa_to_sheet([
    fields.map(f => f.label_ar),
    fields.map(f => `مثال_${f.label_ar}`),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml' });
}

/**
 * Export data as Excel file
 */
export function exportToExcel(data: Record<string, any>[], fileName: string = 'export'): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Get sheet names from Excel file
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error: any) {
        reject(new Error(`خطأ في قراءة الملف: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}
