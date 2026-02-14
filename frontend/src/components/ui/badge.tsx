import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-foreground text-background hover:bg-foreground/80',
      secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
      outline: 'border border-border bg-background',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
