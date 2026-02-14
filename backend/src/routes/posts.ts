import express, { Request, Response } from 'express';
import { pool } from '../db';
import {
  PostsResponse,
  PostsQuery,
  Post,
} from '../types';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'id';
    const order = (req.query.order as string) || 'asc';

    // Calculate offset for pagination
    // Example: page 1 = offset 0, page 2 = offset 20, page 3 = offset 40
    const offset = (page - 1) * limit;

    console.log(`fetching post - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    // Build the query
    let queryText = `
      SELECT id, post_id as "postId", comment_id as "commentId",
             name, email, body, created_at as "createdAt"
      FROM posts
    `;

    let countQueryText = 'SELECT COUNT(*) FROM posts';
    const queryParams: any[] = [];
    let paramCount = 1;

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search}%`;
      queryText += ` WHERE (
        name ILIKE $${paramCount} OR
        email ILIKE $${paramCount + 1} OR
        body ILIKE $${paramCount + 2} OR
        CAST(post_id AS TEXT) ILIKE $${paramCount + 3} OR
        CAST(comment_id AS TEXT) ILIKE $${paramCount + 4}
      )`;

      countQueryText += ` WHERE (
        name ILIKE $${paramCount} OR
        email ILIKE $${paramCount + 1} OR
        body ILIKE $${paramCount + 2} OR
        CAST(post_id AS TEXT) ILIKE $${paramCount + 3} OR
        CAST(comment_id AS TEXT) ILIKE $${paramCount + 4}
      )`;

      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      paramCount += 5;
    }

    // Add sorting (validate sortBy to prevent SQL injection)
    const validSortColumns = ['id', 'postId', 'name', 'email', 'createdAt'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    queryText += ` ORDER BY "${sortColumn}" ${sortOrder}`;

    // Add pagination
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const finalParams = [...queryParams, limit, offset];

    // Execute queries in parallel
    const [dataResult, countResult] = await Promise.all([
      pool.query(queryText, finalParams),
      pool.query(countQueryText, queryParams),
    ]);

    const posts: Post[] = dataResult.rows;
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Found ${posts.length} posts (total: ${total})`);

    // Build response with pagination metadata
    const response: PostsResponse = {
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
    });
  }
});


// DELETION - added for testing purposes
router.delete('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM posts');
    console.log(`🗑️  Deleted ${result.rowCount} posts`);

    return res.json({
      success: true,
      message: `Deleted ${result.rowCount} posts`,
      deletedCount: result.rowCount,
    });
  } catch (error: any) {
    console.error('Error deleting posts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete posts',
    });
  }
});

export default router;
