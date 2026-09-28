import { useDragSession } from './useDragSession';

export interface ResizeEdges {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
}

interface ProbeResizeHandlesProps {
  active: boolean;
  onResizeStart: () => void;
  onResize: (cumulativeDelta: { x: number; y: number }, edges: ResizeEdges) => void;
  onResizeEnd: () => void;
}

const HANDLES: { edges: ResizeEdges; style: React.CSSProperties; cursor: string }[] = [
  { edges: { top: true, left: true }, style: { top: -4, left: -4 }, cursor: 'nwse-resize' },
  { edges: { top: true, right: true }, style: { top: -4, right: -4 }, cursor: 'nesw-resize' },
  { edges: { bottom: true, right: true }, style: { bottom: -4, right: -4 }, cursor: 'nwse-resize' },
  { edges: { bottom: true, left: true }, style: { bottom: -4, left: -4 }, cursor: 'nesw-resize' },
];

export function ProbeResizeHandles({
  active,
  onResizeStart,
  onResize,
  onResizeEnd,
}: ProbeResizeHandlesProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 transition-opacity duration-100 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 rounded-[20px] outline outline-2 outline-foreground-accent-muted" />
      {HANDLES.map((h, i) => (
        <ResizeHandle
          key={i}
          edges={h.edges}
          style={h.style}
          cursor={h.cursor}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      ))}
    </div>
  );
}

function ResizeHandle({
  edges,
  style,
  cursor,
  onResizeStart,
  onResize,
  onResizeEnd,
}: {
  edges: ResizeEdges;
  style: React.CSSProperties;
  cursor: string;
  onResizeStart: () => void;
  onResize: (cumulativeDelta: { x: number; y: number }, edges: ResizeEdges) => void;
  onResizeEnd: () => void;
}) {
  const handleMouseDown = useDragSession({
    onStart: onResizeStart,
    onMove: (delta) => onResize(delta, edges),
    onEnd: onResizeEnd,
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: resize handle is a visual-only drag target; interaction is conveyed via cursor and aria-hidden on the parent
    <div
      onMouseDown={handleMouseDown}
      style={{ ...style, cursor, position: 'absolute' }}
      className="pointer-events-auto h-2 w-2 rounded-full bg-brand"
    />
  );
}
