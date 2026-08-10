import { type ReactNode, useEffect, useState } from 'react';

const EXPAND_PATH = 'M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 4.5V1.5H7.5M1.5 7.5v3h3';
const CLOSE_PATH = 'M7.5 4.5l-6 6M10.5 1.5l-6 6M1.5 1.5l4 4M10.5 10.5l-4-4';

function PreviewToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d={expanded ? CLOSE_PATH : EXPAND_PATH}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {expanded ? 'Close' : 'Expand'}
    </button>
  );
}

export interface StoryPreviewProps {
  title?: string;
  /** What the preview shows. Plain text, or `p` elements for several paragraphs. */
  description?: ReactNode;
  /** Height of the inline frame in pixels. The expanded view always fills 90vh. */
  height?: number;
  /** The canvas to render. Live in one branch at a time, so toggling remounts it. */
  children: ReactNode;
}

/**
 * A framed live canvas with an expand control.
 *
 * A canvas boxed into the docs column is too small to read, so the frame runs
 * wider than the prose and can be blown up to fill the viewport. The children
 * render in the inline frame or the overlay but never both, so only one canvas
 * is ever live and the node registry is never duplicated. The two branches are
 * different positions in the tree, though, so toggling remounts the canvas and
 * its viewport starts over.
 */
export function StoryPreview({
  title = 'Preview',
  description,
  height = 560,
  children,
}: StoryPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  return (
    <>
      <div className="pb-8">
        <div className="mx-auto mb-4 max-w-4xl px-8">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && (
            <div className="text-sm leading-relaxed text-muted-foreground [&>p+p]:mt-1.5">
              {description}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <div
            className="relative w-[90vw] overflow-hidden rounded-xl border border-border"
            style={{ height }}
          >
            {!expanded && children}
            <PreviewToggleButton expanded={false} onClick={() => setExpanded(true)} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          {/* Full-bleed backdrop button: click-outside to close, focusable and Escape-able. */}
          <button
            type="button"
            aria-label="Close expanded preview"
            onClick={() => setExpanded(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative h-[90vh] w-[90vw] overflow-hidden rounded-xl border border-border">
            {children}
            <PreviewToggleButton expanded={true} onClick={() => setExpanded(false)} />
          </div>
        </div>
      )}
    </>
  );
}
