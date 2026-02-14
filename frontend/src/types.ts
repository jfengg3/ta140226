export interface Post {
  id: number;
  postId: number;
  commentId: number;
  name: string;
  email: string;
  body: string;
  createdAt: string; // ISO date string
}

export interface ValidationError {
  row: number;
  reason: string;
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

export interface ErrorResponse {
  success: false;
  error: string;
}
