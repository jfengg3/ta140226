import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { testConnection, initializeDatabase, pool } from './db';
import uploadRouter from './routes/upload';
import postsRouter from './routes/posts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS, allow our frontend at port 5173 to call our backend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// lets define our routes here
app.use('/api/upload', uploadRouter);
app.use('/api/posts', postsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});


async function startServer() {
  try {

    console.log('test db connection');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to db');
      process.exit(1);
    }

    // Initialize database schema
    console.log('create db schema');
    await initializeDatabase();

    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// handling shutdowns?
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});


startServer();
