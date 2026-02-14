import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { PostList } from './components/PostList';
import { deleteAllPosts } from './api';
import { Button } from './components/ui/button';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL posts?\n\nThis action cannot be undone!'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteAllPosts();
      alert(`Successfully deleted ${result.deletedCount} posts`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      alert(`Failed to delete posts: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                TA
              </h1>
              <p className="text-muted-foreground mt-1">
                Demo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearData}
              disabled={isDeleting}
              className="bg-background hover:bg-accent hover:text-accent-foreground border-border"
            >
              {isDeleting ? 'Deleting...' : 'Delete all data'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-8 py-8">
        <div className="space-y-8">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <PostList refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}

export default App;
