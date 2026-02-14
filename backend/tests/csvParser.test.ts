import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCSV, validateHeaders } from '../src/utils/csvParser';

describe('CSV Parser', () => {
  describe('parseCSV - Valid CSV', () => {
    it('should parse a valid CSV with 10 rows', async () => {
      const csvBuffer = readFileSync(join(__dirname, 'fixtures/valid-10.csv'));
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(10);
      expect(result.errors).toHaveLength(0);

      // Check first row structure
      const firstRow = result.validRows[0];
      expect(firstRow.postId).toBe(1);
      expect(firstRow.commentId).toBe(1);
      expect(firstRow.name).toBe('Test Post 1');
      expect(firstRow.email).toBe('user1@example.com');
      expect(firstRow.body).toBe('This is a test post body');
    });

    it('should handle special characters in CSV', async () => {
      const csvBuffer = readFileSync(join(__dirname, 'fixtures/special-chars.csv'));
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      // Check that quotes are preserved in name
      expect(result.validRows[0].name).toContain('quotes');

      // Check that body with newlines is parsed correctly
      expect(result.validRows[1].body).toContain('newlines');

      // Check HTML tags are sanitized (removed for security)
      expect(result.validRows[2].body).not.toContain('<html>');
    });

    it('should convert email to lowercase', async () => {
      const csvContent = 'postId,id,name,email,body\n1,1,Test,USER@EXAMPLE.COM,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows[0].email).toBe('user@example.com');
    });
  });

  describe('parseCSV - Invalid Email', () => {
    it('should reject rows with invalid email format', async () => {
      const csvBuffer = readFileSync(join(__dirname, 'fixtures/invalid-email.csv'));
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(3);

      // Check error messages contain 'email'
      result.errors.forEach(error => {
        expect(error.reason.toLowerCase()).toContain('email');
      });
    });

    it('should reject email without @ symbol', async () => {
      const csvContent = 'postId,id,name,email,body\n1,1,Test,notemail.com,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toContain('email');
    });
  });

  describe('parseCSV - Missing Required Fields', () => {
    it('should reject CSV with missing column', async () => {
      const csvBuffer = readFileSync(join(__dirname, 'fixtures/missing-column.csv'));
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject row with empty required field', async () => {
      const csvContent = 'postId,id,name,email,body\n1,1,,test@example.com,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should reject row with missing postId', async () => {
      const csvContent = 'postId,id,name,email,body\n,1,Test,test@example.com,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('parseCSV - Invalid Data Types', () => {
    it('should reject non-numeric postId', async () => {
      const csvContent = 'postId,id,name,email,body\nabc,1,Test,test@example.com,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should reject non-numeric id', async () => {
      const csvContent = 'postId,id,name,email,body\n1,abc,Test,test@example.com,Body';
      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('parseCSV - Empty CSV', () => {
    it('should handle empty CSV with headers only', async () => {
      const csvBuffer = readFileSync(join(__dirname, 'fixtures/empty.csv'));
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parseCSV - Error Row Numbers', () => {
    it('should report correct row numbers for errors', async () => {
      const csvContent = `postId,id,name,email,body
1,1,Valid,valid@example.com,Body
2,2,Invalid,not-email,Body
3,3,Valid,valid2@example.com,Body
4,4,Invalid,bad-email,Body`;

      const csvBuffer = Buffer.from(csvContent);
      const result = await parseCSV(csvBuffer);

      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[1].row).toBe(4);
    });
  });

  describe('validateHeaders', () => {
    it('should validate correct headers', () => {
      const headers = ['postId', 'id', 'name', 'email', 'body'];
      expect(validateHeaders(headers)).toBe(true);
    });

    it('should reject missing required header', () => {
      const headers = ['postId', 'id', 'name', 'body']; // missing email
      expect(validateHeaders(headers)).toBe(false);
    });

    it('should handle extra headers', () => {
      const headers = ['postId', 'id', 'name', 'email', 'body', 'extra'];
      expect(validateHeaders(headers)).toBe(true);
    });

    it('should handle headers with whitespace', () => {
      const headers = ['postId ', ' id', 'name', 'email', 'body'];
      expect(validateHeaders(headers)).toBe(true);
    });
  });
});
