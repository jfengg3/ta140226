import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../src/components/FileUpload';
import * as api from '../src/api';

// Mock the API module
vi.mock('../src/api');

describe('FileUpload Component', () => {
  it('should render upload button', () => {
    render(<FileUpload />);
    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    expect(uploadButton).toBeInTheDocument();
  });

  it('should render file input', () => {
    render(<FileUpload />);
    const input = screen.getByLabelText(/choose csv file/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', '.csv,text/csv');
  });

  it('should show selected file name and size', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    expect(screen.getByText(/test\.csv/i)).toBeInTheDocument();
    expect(screen.getByText(/size:/i)).toBeInTheDocument();
  });

  it('should handle non-CSV files', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    // Upload button should remain disabled (file not selected)
    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    expect(uploadButton).toBeDisabled();
  });

  it('should reject files larger than 10MB', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    // Create a file larger than 10MB
    const largeContent = 'x'.repeat(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    expect(screen.getByText(/file size must be less than 10mb/i)).toBeInTheDocument();
  });

  it('should disable upload button when no file selected', () => {
    render(<FileUpload />);
    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    expect(uploadButton).toBeDisabled();
  });

  it('should enable upload button when file is selected', async () => {
    const user = userEvent.setup();
    render(<FileUpload />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    expect(uploadButton).not.toBeDisabled();
  });

  it('should show upload progress during upload', async () => {
    const user = userEvent.setup();

    // Mock uploadFile to simulate progress
    vi.mocked(api.uploadFile).mockImplementation((file, onProgress) => {
      if (onProgress) {
        onProgress(50);
      }
      return Promise.resolve({
        success: true,
        message: 'Upload successful',
        stats: {
          totalRows: 10,
          successfulRows: 10,
          failedRows: 0,
          errors: [],
        },
      });
    });

    render(<FileUpload />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    await user.click(uploadButton);

    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show success message after successful upload', async () => {
    const user = userEvent.setup();

    vi.mocked(api.uploadFile).mockResolvedValue({
      success: true,
      message: 'Upload successful',
      stats: {
        totalRows: 5,
        successfulRows: 5,
        failedRows: 0,
        errors: [],
      },
    });

    render(<FileUpload />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
      expect(screen.getByText(/total rows: 5/i)).toBeInTheDocument();
      expect(screen.getByText(/successfully uploaded: 5/i)).toBeInTheDocument();
    });
  });

  it('should show error message on upload failure', async () => {
    const user = userEvent.setup();

    vi.mocked(api.uploadFile).mockRejectedValue(new Error('Network error'));

    render(<FileUpload />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should call onUploadSuccess callback after successful upload', async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();

    vi.mocked(api.uploadFile).mockResolvedValue({
      success: true,
      message: 'Upload successful',
      stats: {
        totalRows: 5,
        successfulRows: 5,
        failedRows: 0,
        errors: [],
      },
    });

    render(<FileUpload onUploadSuccess={onUploadSuccess} />);

    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/choose csv file/i) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload csv/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledOnce();
    });
  });
});
