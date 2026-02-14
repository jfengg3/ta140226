import { useState } from 'react';
import { uploadFile } from '../api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { UploadResponse } from '../types';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handling file type, ensure it is csv
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please select a CSV file');
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  // file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadResult(null);

    try {
      // Upload file with progress tracking
      const result = await uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      setIsUploading(false);

      // Call success callback to refresh the data list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File input */}
        <div>
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Choose CSV file
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border file:border-border
              file:text-sm file:font-medium
              file:bg-background file:text-foreground
              hover:file:bg-accent hover:file:text-accent-foreground
              file:cursor-pointer file:transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Selected file info */}
        {selectedFile && !isUploading && !uploadResult && (
          <div className="text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Selected:</strong> {selectedFile.name}
            </p>
            <p>
              <strong className="text-foreground">Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-muted-foreground text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </Button>

        {/* Success message */}
        {uploadResult && uploadResult.success && (
          <Alert variant="success">
            <AlertTitle>Upload Successful!</AlertTitle>
            <AlertDescription>
              <p>Total rows: {uploadResult.stats.totalRows}</p>
              <p>Successfully uploaded: {uploadResult.stats.successfulRows}</p>
              {uploadResult.stats.failedRows > 0 && (
                <p className="text-red-600">
                  Failed rows: {uploadResult.stats.failedRows}
                </p>
              )}
              {uploadResult.stats.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                    {uploadResult.stats.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="text-xs">
                        Row {err.row}: {err.reason}
                      </li>
                    ))}
                    {uploadResult.stats.errors.length > 5 && (
                      <li className="text-xs">
                        ...and {uploadResult.stats.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="error">
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
