import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { ViewportPortal } from '@uipath/apollo-react/canvas/xyflow/react';
import { Fragment, memo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { SEQ_BAR_HEIGHT } from '../../constants';
import type { SequenceRow } from '../../utils/sequential/sequential.types';
import { CanvasInlineButton } from '../ButtonHandle/CanvasInlineButton';

/**
 * Width of the fixed step-number / chevron column. Every
 * row's column sits at the SAME x regardless of its own indent depth -- a
 * file-explorer "tree rail" rather than a per-row indented gutter -- so this
 * only needs to be wide enough for a chevron (28px) + gap + a couple of digits
 * of step number, not tied to `SEQ_INDENT_PX`.
 */
const SEQ_GUTTER_COLUMN_WIDTH_PX = 64;

/**
 * Horizontal breathing room (px) between the fixed column and where a row's
 * dotted leader line begins. Also the leader's length for a depth-0 row (whose
 * bar sits at the stack's own left edge), so every row -- even top-level ones
 * -- gets a short, deliberate connector instead of the column touching the bar.
 */
const SEQ_GUTTER_LEADER_GAP_PX = 16;

export interface SequentialGutterRow
  extends Pick<SequenceRow, 'nodeId' | 'stepNumber' | 'collapsible' | 'collapsed'> {}

export interface SequentialGutterProps {
  /**
   * Visible rows carrying a step number, in row order (the same filter the
   * canvas assembly derives once and shares with `useSequentialKeyboard`).
   */
  rows: readonly SequentialGutterRow[];
  /**
   * Row id -> top-left flow position, read straight from `layoutSequence`'s
   * result (never from node DOM/measurement), so offscreen culling or a
   * virtualization change upstream can never desync the gutter from the bars
   * it labels; it also means the gutter pans/zooms with the canvas for free
   * since it renders inside the same `ViewportPortal` coordinate space.
   */
  positions: ReadonlyMap<string, XYPosition>;
  /** Height of each sequential row; defaults to the standard bar height. */
  barHeight?: number;
  collapsedStepIds: ReadonlySet<string>;
  /** Fired by a collapsible row's chevron; the caller re-derives `collapsedStepIds`. */
  onToggleCollapse: (nodeId: string, collapsed: boolean) => void;
}

/**
 * Step-number "tree rail" gutter for the Sequential Canvas (D8). A single `ViewportPortal` layer
 * (mirrors `components/NodeViewportOverlay.tsx`'s pattern, generalized to many
 * rows instead of one node) rendering, per visible numbered row:
 *
 *  - the step number and (for collapsible rows) a chevron disclosure button,
 *    right-aligned together in ONE fixed-x column shared by EVERY row
 *    regardless of its own indent depth (`SEQ_GUTTER_COLUMN_WIDTH_PX`, sitting
 *    `SEQ_GUTTER_LEADER_GAP_PX` left of the stack's own left edge) -- a
 *    file-explorer style numbering rail rather than a per-row indented gutter;
 *  - a dotted horizontal leader line from that fixed column to the LEFT EDGE
 *    of the row's own (depth-indented) bar, so a deeper row's leader is
 *    visibly longer, communicating depth the same way a file explorer's
 *    connecting lines do.
 *
 * The chevron carries `aria-expanded` (ARIA disclosure pattern) and a
 * localized `aria-label` -- the row's own accessible name ("Step N of Total:
 * Label") lives on the bar itself via `node.ariaLabel`, stamped by
 * `useSequentialGraph` (D8), not here; the number span is `aria-hidden` so it
 * isn't announced twice. The leader line is purely decorative (`aria-hidden`).
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

  // The stack's own left edge: `layoutSequence` always anchors depth-0 rows at
  // x = 0 (utils/sequential/layoutSequence.ts, read-only reference), but this
  // reads it from the actual positions rather than assuming it, so a future
  // layout change (e.g. a reference chip rendered further left) can't silently
  // desync the rail from the bars it labels.
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
