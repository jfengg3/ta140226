
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();


export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'csv_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// test db connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release(); // release client back to pool
    console.log('db connected at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('db failed to connect:', error);
    return false;
  }
}

// db initialization schema
export async function initializeDatabase(): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_posts_post_id ON posts(post_id);
    CREATE INDEX IF NOT EXISTS idx_posts_email ON posts(email);
  `;

  try {
    await pool.query(createTableQuery);
    console.log('db initialized');
  } catch (error) {
    console.error('db failed to initialize schema', error);
    throw error;
  }
}

// db close connection
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('db connection closed');
}
