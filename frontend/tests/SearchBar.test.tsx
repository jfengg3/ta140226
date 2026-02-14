import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../src/components/SearchBar';

describe('SearchBar Component', () => {
  it('should render search input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} placeholder="Custom search..." />);

    expect(screen.getByPlaceholderText(/custom search/i)).toBeInTheDocument();
  });

  it('should call onSearch after typing with debounce', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'test');

    // Should not call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Should call after debounce (300ms)
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 500 }
    );
  });

  it('should debounce multiple keystrokes', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);

    // Type multiple characters quickly
    await user.type(input, 'hello');

    // Wait for debounce
    await waitFor(
      () => {
        // Should only call once after debounce, not for each keystroke
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('hello');
      },
      { timeout: 500 }
    );
  });

  it('should show clear button when there is text', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);

    // No clear button initially
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Type some text
    await user.type(input, 'test');

    // Clear button should appear
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

    await user.type(input, 'test');

    // Wait for text to be in input
    await waitFor(() => {
      expect(input.value).toBe('test');
    });

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    // Input should be cleared
    expect(input.value).toBe('');

    // onSearch should be called with empty string
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('');
      },
      { timeout: 500 }
    );
  });

  it('should call onSearch with empty string on clear', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'test');

    // Wait for debounced search
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    }, { timeout: 500 });

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('');
    }, { timeout: 500 });
  });
});
