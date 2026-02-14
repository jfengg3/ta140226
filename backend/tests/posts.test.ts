import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import postsRouter from '../src/routes/posts';
import { pool } from '../src/db';

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/posts', postsRouter);

describe('Posts API', () => {
  beforeAll(async () => {
    // Clear the posts table before tests
    await pool.query('DELETE FROM posts');

    // Insert test data
    const testPosts = [
      { postId: 1, commentId: 1, name: 'Test Post 1', email: 'user1@example.com', body: 'First post body' },
      { postId: 1, commentId: 2, name: 'Test Post 2', email: 'user2@example.com', body: 'Second post body' },
      { postId: 2, commentId: 3, name: 'Search Me', email: 'search@example.com', body: 'Searchable content' },
      { postId: 2, commentId: 4, name: 'Test Post 4', email: 'user4@example.com', body: 'Fourth post body' },
      { postId: 3, commentId: 5, name: 'Test Post 5', email: 'user5@example.com', body: 'Fifth post body' },
    ];

    for (const post of testPosts) {
      await pool.query(
        'INSERT INTO posts (post_id, comment_id, name, email, body) VALUES ($1, $2, $3, $4, $5)',
        [post.postId, post.commentId, post.name, post.email, post.body]
      );
    }
  });

  afterAll(async () => {
    // Clean up and close pool
    await pool.query('DELETE FROM posts');
    await pool.end();
  });

  describe('GET /api/posts', () => {
    it('should return paginated posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(5); // All 5 posts
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBe(5);
    });

    it('should handle pagination with limit', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=2')
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(3); // 5 posts / 2 per page = 3 pages
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(false);
    });

    it('should return second page of results', async () => {
      const response = await request(app)
        .get('/api/posts?page=2&limit=2')
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(true);
    });

    it('should handle page beyond available data', async () => {
      const response = await request(app)
        .get('/api/posts?page=100&limit=20')
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.page).toBe(100);
      expect(response.body.pagination.hasNext).toBe(false);
    });

    it('should handle page=0 by treating it as page=1', async () => {
      const response = await request(app)
        .get('/api/posts?page=0')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/posts - Search', () => {
    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/posts?search=Search Me')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('Search Me');
    });

    it('should search by email', async () => {
      const response = await request(app)
        .get('/api/posts?search=search@example.com')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toBe('search@example.com');
    });

    it('should search by body content', async () => {
      const response = await request(app)
        .get('/api/posts?search=Searchable')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].body).toContain('Searchable');
    });

    it('should search by postId', async () => {
      const response = await request(app)
        .get('/api/posts?search=2')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      // Should find posts with postId=2
      const hasPostId2 = response.body.data.some((post: any) => post.postId === 2);
      expect(hasPostId2).toBe(true);
    });

    it('should return empty array for non-matching search', async () => {
      const response = await request(app)
        .get('/api/posts?search=NonExistentSearchTerm12345')
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });

    it('should handle case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/posts?search=SEARCH')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle special characters in search without SQL injection', async () => {
      const response = await request(app)
        .get('/api/posts?search=%27; DROP TABLE posts; --')
        .expect(200);

      // Should not crash, just return no results
      expect(response.body.data).toBeInstanceOf(Array);

      // Verify table still exists by querying it
      const checkTable = await pool.query('SELECT COUNT(*) FROM posts');
      expect(parseInt(checkTable.rows[0].count)).toBe(5);
    });
  });

  describe('DELETE /api/posts', () => {
    it('should delete all posts', async () => {
      const response = await request(app)
        .delete('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(5);

      // Verify all posts are deleted
      const checkPosts = await request(app).get('/api/posts');
      expect(checkPosts.body.data.length).toBe(0);
    });
  });
});
