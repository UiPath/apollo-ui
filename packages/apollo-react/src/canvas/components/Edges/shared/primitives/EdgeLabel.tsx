export type EdgeLabelProps = {
  x: number;
  y: number;
  text: string;
  selected?: boolean;
};

export type EdgeLabelContentProps = Pick<EdgeLabelProps, 'text' | 'selected'> & {
  centered?: boolean;
};

/** Shared visual treatment for SVG and portal-positioned edge labels. */
export function EdgeLabelContent({ text, selected, centered }: EdgeLabelContentProps) {
  return (
    <div
      className="react-flow__edge-label nodrag nopan"
      style={{
        ...(centered ? { position: 'absolute', transform: 'translate(-50%, -50%)' } : {}),
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        color: 'var(--canvas-foreground)',
        background: 'var(--canvas-background)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        border: `1px solid ${selected ? 'var(--canvas-primary)' : 'var(--canvas-border)'}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      {text}
    </div>
  );
}

export function EdgeLabel({ x, y, text, selected }: EdgeLabelProps) {
  return (
    <foreignObject
      x={x}
      y={y}
      width={1}
      height={1}
      overflow="visible"
      style={{ pointerEvents: 'none' }}
    >
      <EdgeLabelContent text={text} selected={selected} centered />
    </foreignObject>
  );
}
