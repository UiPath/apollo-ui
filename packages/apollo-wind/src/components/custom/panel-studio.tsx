import * as React from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// StudioPanel
// ============================================================================

const PANEL_DEFAULT_WIDTH = 340;
const PANEL_MIN_WIDTH = 200;
const PANEL_MAX_WIDTH = 460;

export interface StudioPanelProps {
  /** Controls which side border and resize handle are applied */
  side: 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  /** Reserved for future collapse behavior — not currently used for styling */
  isCollapsed?: boolean;
}

/**
 * Resizable panel container for the Studio template.
 *
 * - Default width 296px, resizable from 200px to 460px by dragging the inner edge
 * - Applies a border on the inner edge (right for left panel, left for right panel)
 * - No built-in toggle button — visibility is controlled by the parent template
 */
export function StudioPanel({
  side,
  children,
  className,
  isCollapsed: _isCollapsed = false,
}: StudioPanelProps) {
  const [width, setWidth] = React.useState(PANEL_DEFAULT_WIDTH);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(ev: MouseEvent) {
      const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX;
      setWidth(Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, startWidth + delta)));
    }

    function onMouseUp() {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div
      className={cn(
        'relative flex h-full shrink-0 flex-col overflow-hidden bg-surface',
        side === 'left' ? 'border-r border-border-subtle' : 'border-l border-border-subtle',
        className
      )}
      style={{ width }}
    >
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Resize handle — sits on the inner border edge */}
      {/* biome-ignore lint/a11y/useSemanticElements: Interactive resizable separator needs role="separator" with aria-valuenow */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={width}
        aria-valuemin={PANEL_MIN_WIDTH}
        aria-valuemax={PANEL_MAX_WIDTH}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const delta = e.key === 'ArrowLeft' ? -10 : 10;
            const adjustedDelta = side === 'left' ? delta : -delta;
            setWidth(Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, width + adjustedDelta)));
          }
        }}
        className={cn(
          'absolute top-0 z-10 h-full w-1 cursor-col-resize transition-colors duration-150',
          'hover:bg-brand/40 active:bg-brand/60',
          side === 'left' ? 'right-0' : 'left-0'
        )}
      />
    </div>
  );
}

// ============================================================================
// StudioPanelSelection
// ============================================================================

export interface StudioPanelSelectionProps {
  /** Semantic side — not currently used for styling */
  side: 'left' | 'right';
  /**
   * Called with the 0-based index of the clicked icon.
   * Use this to switch the active panel view or toggle visibility.
   */
  onIconClick: (index: number) => void;
  /**
   * Index of the currently active icon (0–4).
   * That icon receives the active highlight style and `aria-pressed="true"`.
   * Pass `undefined` (or omit) when no view is selected (panel hidden).
   */
  activeIndex?: number;
  className?: string;
}

/**
 * Vertical icon rail for the Studio template.
 *
 * Renders 5 icon buttons stacked top-to-bottom. Each button calls
 * `onIconClick(index)` so the parent can switch to a specific panel view
 * or toggle visibility. The active icon is highlighted via `activeIndex`.
 *
 * The rail is always visible regardless of whether its paired `StudioPanel`
 * is shown. Pass `className="border-r border-border-subtle"` for the left
 * rail or `"border-l border-border-subtle"` for the right rail.
 *
 * The placeholder icon can be replaced with your `icon-panel-select.svg`
 * by swapping `<PanelSelectIcon />` with an `<img>` pointing to that asset.
 */
export function StudioPanelSelection({
  side: _side,
  onIconClick,
  activeIndex,
  className,
}: StudioPanelSelectionProps) {
  return (
    <div
      className={cn(
        'flex h-full w-12 shrink-0 flex-col items-center gap-6 overflow-hidden bg-surface pt-6',
        className
      )}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onIconClick(i)}
            aria-label={`Panel view ${i + 1}`}
            aria-pressed={isActive}
            className={cn(
              'flex h-[18px] w-[18px] items-center justify-center rounded transition-colors',
              isActive
                ? 'bg-brand-subtle text-foreground-accent ring-1 ring-brand/30'
                : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            )}
          >
            {isActive ? (
              <FolderOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Folder className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
