import { useState, useEffect } from 'react';
import { Input } from './ui/input';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search...' }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Added debounce <-- prevent excessive api calls
  // Waits 300ms after user stops typing before calling onSearch
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, onSearch]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
