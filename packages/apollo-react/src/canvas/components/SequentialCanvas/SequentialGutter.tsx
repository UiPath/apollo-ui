import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { ViewportPortal } from '@uipath/apollo-react/canvas/xyflow/react';
import { Fragment, memo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { SEQ_BAR_HEIGHT } from '../../constants';
import type { SequenceRow } from '../../utils/sequential/sequential.types';
import { CanvasInlineButton } from '../ButtonHandle/CanvasInlineButton';

/** Width of the fixed step-number / chevron column; the same x for every row regardless of depth. */
const SEQ_GUTTER_COLUMN_WIDTH_PX = 64;

/** Gap between the column and the leader line start; also a depth-0 row's leader length. */
const SEQ_GUTTER_LEADER_GAP_PX = 16;

export interface SequentialGutterRow
  extends Pick<SequenceRow, 'nodeId' | 'stepNumber' | 'collapsible' | 'collapsed'> {}

export interface SequentialGutterProps {
  /** Visible rows carrying a step number, in row order. */
  rows: readonly SequentialGutterRow[];
  /** Row id -> flow position from `layoutSequence`, never from node DOM, so culling cannot desync it. */
  positions: ReadonlyMap<string, XYPosition>;
  /** Height of each sequential row; defaults to the standard bar height. */
  barHeight?: number;
  collapsedStepIds: ReadonlySet<string>;
  /** Fired by a collapsible row's chevron; the caller re-derives `collapsedStepIds`. */
  onToggleCollapse: (nodeId: string, collapsed: boolean) => void;
}

/**
 * Step-number "tree rail" gutter: one ViewportPortal layer with, per numbered row, the step
 * number and collapse chevron in a fixed-x column plus a dotted leader to the row's indented
 * bar. The row's accessible name lives on the bar via `node.ariaLabel`, so the number is aria-hidden.
 */
export const SequentialGutter = memo(function SequentialGutter({
  rows,
  positions,
  barHeight = SEQ_BAR_HEIGHT,
  collapsedStepIds,
  onToggleCollapse,
}: SequentialGutterProps) {
  const { _ } = useSafeLingui();

  if (rows.length === 0) return null;

  // Read the stack's left edge from the positions rather than assuming x = 0, so a layout
  // change cannot desync the rail from the bars.
  let stackLeftX = 0;
  for (const position of positions.values()) {
    if (position.x < stackLeftX) stackLeftX = position.x;
  }
  const columnLeftX = stackLeftX - SEQ_GUTTER_COLUMN_WIDTH_PX - SEQ_GUTTER_LEADER_GAP_PX;
  const leaderStartX = stackLeftX - SEQ_GUTTER_LEADER_GAP_PX;

  return (
    <ViewportPortal>
      <div data-testid="sequential-gutter" className="pointer-events-none">
        {rows.map((row) => {
          const position = positions.get(row.nodeId);
          if (!position || row.stepNumber === undefined) return null;
          const collapsed = collapsedStepIds.has(row.nodeId);
          const rowCenterY = position.y + barHeight / 2;

          return (
            <Fragment key={row.nodeId}>
              <div
                data-testid="sequential-gutter-row"
                className="absolute flex items-center justify-end gap-1"
                style={{
                  left: columnLeftX,
                  top: position.y,
                  width: SEQ_GUTTER_COLUMN_WIDTH_PX,
                  height: barHeight,
                }}
              >
                {row.collapsible && (
                  <CanvasInlineButton
                    className="pointer-events-auto nodrag nopan"
                    icon={collapsed ? 'chevron-right' : 'chevron-down'}
                    iconSize={14}
                    aria-expanded={!collapsed}
                    aria-label={
                      collapsed
                        ? _({
                            id: 'sequential-canvas.gutter.expand-step',
                            message: 'Expand step {stepNumber}',
                            values: { stepNumber: row.stepNumber },
                          })
                        : _({
                            id: 'sequential-canvas.gutter.collapse-step',
                            message: 'Collapse step {stepNumber}',
                            values: { stepNumber: row.stepNumber },
                          })
                    }
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleCollapse(row.nodeId, !collapsed);
                    }}
                  />
                )}
                <span
                  aria-hidden="true"
                  data-testid="sequential-gutter-number"
                  className="pointer-events-none min-w-[1.5em] text-right text-xs font-medium tabular-nums text-foreground-muted"
                >
                  {row.stepNumber}
                </span>
              </div>
              <div
                aria-hidden="true"
                data-testid="sequential-gutter-leader"
                className="absolute border-t border-dotted border-border-de-emp"
                style={{
                  left: leaderStartX,
                  top: rowCenterY,
                  width: Math.max(0, position.x - leaderStartX),
                }}
              />
            </Fragment>
          );
        })}
      </div>
    </ViewportPortal>
  );
});
