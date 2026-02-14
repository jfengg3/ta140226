import { CSVRow, ValidationError } from '../types';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
export function isValidNumber(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

export function validateCSVRow(row: CSVRow, rowNumber: number): string[] {
  const errors: string[] = [];

  // Check required fields are present
  if (!row.postId || row.postId.trim() === '') {
    errors.push('Missing required field: postId');
  }
  if (!row.id || row.id.trim() === '') {
    errors.push('Missing required field: id');
  }
  if (!row.name || row.name.trim() === '') {
    errors.push('Missing required field: name');
  }
  if (!row.email || row.email.trim() === '') {
    errors.push('Missing required field: email');
  }
  if (!row.body || row.body.trim() === '') {
    errors.push('Missing required field: body');
  }

  // Validate data types
  if (row.postId && !isValidNumber(row.postId)) {
    errors.push('postId must be a valid number');
  }
  if (row.id && !isValidNumber(row.id)) {
    errors.push('id must be a valid number');
  }

  // Validate email format
  if (row.email && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  return errors;
}
export function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
}
