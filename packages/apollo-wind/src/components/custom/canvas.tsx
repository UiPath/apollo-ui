import * as React from 'react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface CanvasProps {
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// Canvas
// ============================================================================

/**
 * Main content canvas for Delegate templates.
 *
 * Provides the dark background surface that sits alongside the DelegatePanel.
 * Content placed inside the Canvas can be laid out freely — future iterations
 * will add optional layout guidelines (max-width constraints, centered
 * content zones, padding presets, etc.).
 */
export function Canvas({ className, children }: CanvasProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-auto bg-future-surface',
        className
      )}
    >
      {children}
    </div>
  );
}
