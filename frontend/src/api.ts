import { PostsResponse, UploadResponse } from './types';

// Base URL api
const API_BASE_URL = 'http://localhost:3001/api';

export function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Use xhr to track upload progress.. as opposed to fetch()?
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    });

    // if successfull, get response
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Error handling, etc..
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    xhr.open('POST', `${API_BASE_URL}/upload`);
    xhr.timeout = 60000;
    xhr.send(formData);
  });
}

/**
 * Fetch all the posts/data
 */
export async function getPosts(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PostsResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);

  const url = `${API_BASE_URL}/posts?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch posts');
  }

  return response.json();
}

/**
 * Delete all posts/data (I include this for testing purposes only)
 */
export async function deleteAllPosts(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete posts');
  }

  return response.json();
}
