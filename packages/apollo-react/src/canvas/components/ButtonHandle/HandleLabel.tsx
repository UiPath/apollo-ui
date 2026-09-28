import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cx } from '../../utils/CssUtil';

export const LABEL_SHADOW_STYLE = {
  textShadow: '0 0 4px var(--canvas-background), 0 0 4px var(--canvas-background)',
} as const;

const LABEL_POSITION: Record<Position, string> = {
  [Position.Top]: 'bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2',
  [Position.Bottom]: 'top-[calc(100%+4px)] left-1/2 -translate-x-1/2',
  [Position.Left]: 'right-[calc(100%+4px)] top-1/2 -translate-y-1/2',
  [Position.Right]: 'left-[calc(100%+4px)] top-1/2 -translate-y-1/2',
};

export const HandleLabel = ({
  position,
  backgroundColor,
  label,
  labelIcon,
  shouldTruncate,
  visible = true,
}: {
  position: Position;
  backgroundColor?: string;
  label: string;
  labelIcon?: React.ReactNode;
  shouldTruncate?: boolean;
  visible?: boolean;
}) => (
  <div
    aria-hidden={visible ? undefined : true}
    className={cx(
      'absolute px-1.5 py-0.5 rounded-sm z-1 whitespace-nowrap select-none transition-opacity duration-250',
      visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      LABEL_POSITION[position],
      shouldTruncate && 'max-w-[50px] overflow-hidden'
    )}
    style={backgroundColor ? { backgroundColor } : undefined}
  >
    <Row align="center" gap={4}>
      {labelIcon}
      <span
        className={cx(
          'text-xs font-bold text-foreground-muted',
          shouldTruncate && 'overflow-hidden text-ellipsis whitespace-nowrap'
        )}
        style={backgroundColor ? undefined : LABEL_SHADOW_STYLE}
      >
        {label}
      </span>
    </Row>
  </div>
);
