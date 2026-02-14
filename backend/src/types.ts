// Single post from csv
export interface Post {
  id: number;              // Database ID (auto-generated)
  postId: number;          // Post ID from CSV
  commentId: number;       // Original comment ID from CSV
  name: string;            // Post title/name
  email: string;           // Post author email
  body: string;            // Post content
  createdAt: Date;         // When the record was created
}

export interface CSVRow {
  postId: string;          // These are strings when first parsed
  id: string;
  name: string;
  email: string;
  body: string;
}

export interface ValidationError {
  row: number;             // Row number where error occurred
  reason: string;          // Description of the error
}

export interface ParseResult {
  validRows: Post[];       // Successfully validated rows
  errors: ValidationError[]; // Validation errors with row numbers
}

export interface UploadResponse {
  success: boolean;
  message: string;
  stats: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors: ValidationError[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  pagination: PaginationMeta;
}

export interface PostResponse {
  success: boolean;
  data: Post;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface PostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'id' | 'postId' | 'name' | 'email' | 'createdAt';
  order?: 'asc' | 'desc';
}
