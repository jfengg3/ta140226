import { Button } from './ui/button';
import { PaginationMeta } from '../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNext, hasPrev, total } = pagination;

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} total items)
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
        >
          ← Previous
        </Button>

        {/* Page numbers (show current and nearby pages) */}
        <div className="flex gap-1">
          {page > 2 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {page > 3 && <span className="px-2 py-1 text-muted-foreground">...</span>}
            </>
          )}

          {page > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(page - 1)}
            >
              {page - 1}
            </Button>
          )}

          <Button variant="default" size="sm" disabled>
            {page}
          </Button>

          {page < totalPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(page + 1)}
            >
              {page + 1}
            </Button>
          )}

          {page < totalPages - 1 && (
            <>
              {page < totalPages - 2 && <span className="px-2 py-1 text-muted-foreground">...</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
