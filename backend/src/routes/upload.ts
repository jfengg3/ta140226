import express, { Request, Response } from 'express';
import multer from 'multer';
import { parseCSV } from '../utils/csvParser';
import { pool } from '../db';
import { UploadResponse } from '../types';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});


// post API endpoint -> /api/upload
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    console.log(`processing file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Parse and validate the CSV file
    const parseResult = await parseCSV(req.file.buffer);

    // Insert valid rows into database using a transaction (due to atomic, we can commit)
    let insertedCount = 0;

    if (parseResult.validRows.length > 0) {
      const client = await pool.connect();

      try {
        // Start transaction
        await client.query('BEGIN');

        // Insert each valid row
        for (const post of parseResult.validRows) {
          const insertQuery = `
            INSERT INTO posts (post_id, comment_id, name, email, body)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (comment_id) DO UPDATE
            SET post_id = EXCLUDED.post_id,
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                body = EXCLUDED.body
          `;

          await client.query(insertQuery, [
            post.postId,
            post.commentId,
            post.name,
            post.email,
            post.body,
          ]);

          insertedCount++;
        }

        // Commit transaction - all inserts succeeded
        await client.query('COMMIT');
        console.log(`💾 Inserted ${insertedCount} rows into database`);
      } catch (error) {
        // Rollback transaction if smt failed
        await client.query('ROLLBACK');
        console.error('Database insertion failed, rolled back:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // Send response with upload stats
    const response: UploadResponse = {
      success: true,
      message: `CSV processed successfully`,
      stats: {
        totalRows: parseResult.validRows.length + parseResult.errors.length,
        successfulRows: insertedCount,
        failedRows: parseResult.errors.length,
        errors: parseResult.errors,
      },
    };

    return res.status(201).json(response);
  } catch (error: any) {
    console.error('Upload error:', error);

    // Send error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process CSV file',
    });
  }
});

export default router;
