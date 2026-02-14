import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostList } from '../src/components/PostList';
import * as api from '../src/api';

// Mock the API module
vi.mock('../src/api');

const mockPostsResponse = {
  success: true,
  data: [
    {
      id: 1,
      postId: 1,
      commentId: 1,
      name: 'Test Post 1',
      email: 'test1@example.com',
      body: 'First post body',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      postId: 1,
      commentId: 2,
      name: 'Test Post 2',
      email: 'test2@example.com',
      body: 'Second post body',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

describe('PostList Component', () => {
  it('should show loading state initially', () => {
    vi.mocked(api.getPosts).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PostList />);

    expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
  });

  it('should render posts after loading', async () => {
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it('should display post details correctly', async () => {
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    render(<PostList />);

    // Wait for posts to load
    await screen.findByText('Test Post 1');

    // Check email (should be a mailto link)
    const emailLink = screen.getByText('test1@example.com');
    expect(emailLink).toHaveAttribute('href', 'mailto:test1@example.com');

    // Check body
    expect(screen.getByText('First post body')).toBeInTheDocument();
  });

  it('should show empty state when no posts', async () => {
    vi.mocked(api.getPosts).mockResolvedValue({
      ...mockPostsResponse,
      data: [],
      pagination: { ...mockPostsResponse.pagination, total: 0 },
    });

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
      expect(screen.getByText(/upload a csv file to get started/i)).toBeInTheDocument();
    });
  });

  it('should show error message on fetch failure', async () => {
    vi.mocked(api.getPosts).mockRejectedValue(new Error('Network error'));

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should render search bar', async () => {
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/filter posts/i)).toBeInTheDocument();
    });
  });

  it('should call getPosts with search term', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    render(<PostList />);

    const searchInput = await screen.findByPlaceholderText(/filter posts/i);

    await user.type(searchInput, 'test search');

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(api.getPosts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test search' })
        );
      },
      { timeout: 1000 }
    );
  });

  it('should show pagination controls', async () => {
    vi.mocked(api.getPosts).mockResolvedValue({
      ...mockPostsResponse,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    });

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });
  });

  it('should disable previous button on first page', async () => {
    vi.mocked(api.getPosts).mockResolvedValue({
      ...mockPostsResponse,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    });

    render(<PostList />);

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });
  });

  it('should disable next button on last page', async () => {
    vi.mocked(api.getPosts).mockResolvedValue({
      ...mockPostsResponse,
      pagination: {
        page: 3,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      },
    });

    render(<PostList />);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next →/i });
      expect(nextButton).toBeDisabled();
    });
  });

  it('should refresh when refreshTrigger changes', async () => {
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    const { rerender } = render(<PostList refreshTrigger={0} />);

    // Wait for initial render
    await screen.findByText('Test Post 1');

    // Clear previous calls
    vi.clearAllMocks();

    // Change refreshTrigger
    rerender(<PostList refreshTrigger={1} />);

    // Should fetch again
    await waitFor(() => {
      expect(api.getPosts).toHaveBeenCalled();
    });
  });

  it('should display table headers', async () => {
    vi.mocked(api.getPosts).mockResolvedValue(mockPostsResponse);

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText(/^ID$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Post$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Name$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Email$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Body$/i)).toBeInTheDocument();
    });
  });
});
