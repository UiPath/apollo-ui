import { cn } from '@uipath/apollo-wind';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import type React from 'react';
import type { MarkTone } from './marks';

/** Apollo's status icons: `circle-alert` for an error, `triangle-alert` for a warning. */
export const MarkGlyph: React.FC<{ tone?: MarkTone; className?: string }> = ({
  tone,
  className,
}) => {
  if (tone === 'error')
    return (
      <CircleAlert
        aria-hidden
        data-glyph="error"
        className={cn('size-3 shrink-0 text-error-icon', className)}
      />
    );
  if (tone === 'warning')
    return (
      <TriangleAlert
        aria-hidden
        data-glyph="warning"
        className={cn('size-3 shrink-0 text-warning-icon', className)}
      />
    );
  return null;
};
