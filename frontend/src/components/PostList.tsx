import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '../api';
import { Post, PostsResponse } from '../types';
import { SearchBar } from './SearchBar';
import { Pagination } from './Pagination';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { truncateText } from '../lib/utils';

interface PostListProps {
  refreshTrigger?: number;
}

export function PostList({ refreshTrigger = 0 }: PostListProps) {
  const [data, setData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [page, searchTerm, refreshTrigger]);

  const fetchPosts = async () => {
    if (!data) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await getPosts({
        page,
        limit: 20,
        search: searchTerm || undefined,
      });

      setData(response);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Card className="border-border">
      <div className="p-6 space-y-4">
        {/* Header with search */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Posts</h2>
        </div>

        <SearchBar
          onSearch={handleSearch}
          placeholder="Filter posts..."
        />

        {/* Refreshing indicator */}
        {isRefreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent"></div>
            <span>Updating...</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
            <p className="mt-3 text-muted-foreground text-sm">Loading posts...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? 'No results found for your search.' : 'No posts yet. Upload a CSV file to get started.'}
            </p>
          </div>
        )}

        {/* Posts table */}
        {!loading && !error && data && data.data.length > 0 && (
          <>
            <div className={`border border-border rounded-lg transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Body
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((post) => (
                    <tr
                      key={post.id}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground font-mono">
                          {post.commentId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-xs">
                          Post {post.postId}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">
                          {truncateText(post.name, 40)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${post.email}`}
                          className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        >
                          {post.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {truncateText(post.body, 80)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4">
              <Pagination
                pagination={data.pagination}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
