import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH, SEQ_HANDLE_LEFT_OFFSET } from '../../constants';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';
import { CanvasIcon } from '../../utils/icon-registry';
import type { NodeMenuItem } from '../NodeContextMenu';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';
import type { NodeToolbarConfig } from '../Toolbar';
import { getStatusBorder } from './BaseNodeContainer';
import { BaseInnerShape } from './BaseNodeInnerShape';
import { NodeLabel, type NodeLabelProps } from './NodeLabel';

/**
 * Bar geometry as CSS custom properties, shared by the manifest-backed step bar
 * (BaseNodeBar) and the synthetic start / placeholder bars so all three render
 * at an identical size. Fixed values (not the card's ratio math) because a
 * compact row needs a constant icon box rather than one that scales with the
 * container aspect ratio. Icon box shrunk to ~32px (from 40px) to stay
 * balanced against the tightened `SEQ_BAR_HEIGHT`; the
 * icon-to-box and radius-to-box ratios are unchanged from the original.
 */
export const SEQ_BAR_VARS = {
  '--node-w': `${SEQ_BAR_WIDTH}px`,
  '--node-h': `${SEQ_BAR_HEIGHT}px`,
  '--node-radius': '12px',
  '--inner-w': '32px',
  '--inner-h': '32px',
  '--inner-radius': '8px',
  '--icon-size': '16px',
} as React.CSSProperties;

/** Returns the shared bar CSS variables with optional layout-owned dimensions. */
export function getSeqBarVars(width = SEQ_BAR_WIDTH, height = SEQ_BAR_HEIGHT): React.CSSProperties {
  return {
    ...SEQ_BAR_VARS,
    '--node-w': `${width}px`,
    '--node-h': `${height}px`,
  } as React.CSSProperties;
}

/**
 * Static base classes for the bar shell. Mirrors BaseContainer's channel
 * discipline (surface + border) in a horizontal layout. The rest/hover/lifted
 * shadow classes are layered on per instance (gated by the `shadow` prop, like
 * BaseContainer), along with status border, hover, and selection classes.
 * Padding/gap tightened (`px-4`/`gap-3` -> `px-3`/`gap-2`) alongside the
 * shorter `SEQ_BAR_HEIGHT` so the row reads balanced rather than cramped.
 */
export const SEQ_BAR_SHELL_CLASS =
  'relative flex flex-row items-center gap-2 px-3 bg-surface-overlay border border-border w-(--node-w) h-(--node-h) rounded-(--node-radius) outline-offset-0 transition-[box-shadow,border-color] duration-150';

/**
 * Handle ids used by every sequential bar. Rows expose one invisible top target
 * and one invisible bottom source; connectors and the assembly wire
 * edges between `source` of row N and `target` of row N+1.
 */
export const SEQUENTIAL_BAR_HANDLE_IDS = {
  target: 'seq-target',
  source: 'seq-source',
  // Mid-left target used only by `branch-entry` connectors: a branch/container
  // lane's first row is entered from its LEFT side at mid-height (not the top),
  // so the elbow off the owner's spine reads as an indent. Left handles sit at
  // the bar's left edge, vertically centered, with no left-offset.
  branchTarget: 'seq-branch-target',
} as const;

/**
 * Transparent 8px handle: sequential bars are not user-connectable in v1.
 * `left` is pinned to `SEQ_HANDLE_LEFT_OFFSET` so the handle anchors to the
 * bar's bottom-left / top-left region instead of xyflow's
 * default horizontal center; the vertical placement and centering transform
 * still come from xyflow's `.react-flow__handle-{top,bottom}` classes; this
 * inline style only overrides `left`, not `transform`, so the handle's CENTER
 * point lands exactly `SEQ_HANDLE_LEFT_OFFSET`px from the bar's left edge.
 * Shared by the manifest-backed bar (below) and the synthetic start/placeholder
 * bars (nodes/SequentialStartNode.tsx, nodes/SequentialPlaceholderNode.tsx) so
 * every row -- real or synthetic -- anchors its connectors identically.
 */
export const INVISIBLE_HANDLE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  left: SEQ_HANDLE_LEFT_OFFSET,
};

/**
 * Decorative stacked layer for a collapsed sequential row, mirroring
 * BaseContainer's `isStacked` recipe (components/BaseNode/BaseNodeContainer.tsx)
 * adapted to the bar's horizontal shape: a `::before` pseudo-element the same
 * size as the bar, offset down and pushed behind it (`-z-10`), so a thin arc of
 * a second bar peeks out below -- signalling that collapsed content sits
 * underneath. Kept as a local copy (not a shared export) so this file's owner
 * doesn't need to also own BaseNodeContainer.tsx; keep the two class strings in
 * sync if BaseContainer's recipe changes.
 */
const SEQ_BAR_STACKED_LAYER_CLASS =
  'before:content-[""] before:absolute before:inset-x-0 before:top-0 before:h-full before:rounded-[inherit] before:bg-surface-overlay before:border before:border-brand before:translate-y-[6px] before:-z-10 before:pointer-events-none';

export interface BaseNodeBarProps {
  nodeId: string;
  width?: number;
  height?: number;
  mode?: 'design' | 'view' | 'readonly';
  selected?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  label?: string;
  subLabel?: NodeLabelProps['subLabel'];
  labelTooltip?: string;
  labelBackgroundColor?: string;
  icon: React.ReactNode;
  loading?: boolean;
  /** Drives both the icon-box background and the left accent strip. */
  iconBackground?: string;
  iconColor?: string;
  /** Same resolved display.background the card applies via BaseContainer. */
  background?: string;
  /** Same resolved display.shadow the card applies via BaseContainer. Defaults to true. */
  shadow?: boolean;
  executionStatus?: ElementStatusValues;
  validationStatus?: ValidationErrorSeverity;
  suggestionType?: SuggestionType;
  /** The resolved trailing status/validation indicator (adornments.topRight). */
  statusIndicator?: React.ReactNode;
  /** Same resolved toolbar as the card; its actions feed the kebab menu (D3). */
  toolbarConfig?: NodeToolbarConfig;
  /** Hides the kebab during rubber-band multi-select, mirroring the card toolbar (BaseNode.tsx `hidden`). */
  multipleNodesSelected?: boolean;
  /**
   * True when this row is a collapsed collapsible step. Driven by
   * view-local collapsed state threaded through context (SequentialStepNode ->
   * SequentialCollapsedRowsContext), never `node.data`, so the sequential
   * clone's data stays reference-stable (D12). Renders the same decorative
   * stacked-layer treatment BaseContainer uses for `isStacked` cards.
   */
  stacked?: boolean;
  /**
   * Extra kebab items appended after the resolved toolbar actions, with
   * a divider between the two groups when both are non-empty. See
   * `BaseNodeProps.extraMenuItems`'s doc comment (BaseNode.tsx) for the D3
   * rationale (a direct prop, not a new `BaseNodeOverrideConfig` field).
   */
  extraMenuItems?: NodeMenuItem[];
  /**
   * Manifest source/target handle ids to expose as extra INVISIBLE anchor
   * handles alongside the generic seq-source/seq-target. A bar collapses
   * each side to one point visually, but the Add Node connection validator
   * resolves a node's handle by id against its manifest, so the insert preview
   * must be able to anchor on a real manifest handle id that the bar actually
   * renders. Derived connectors keep using seq-source/seq-target.
   */
  manifestSourceHandleIds?: string[];
  manifestTargetHandleIds?: string[];
  onLabelChange?: (values: { label: string; subLabel: string }) => void;
  onActionNeeded?: (nodeId: string) => void;
}

/**
 * Horizontal "bar" rendering of a node for the Sequential Canvas view. Fed by
 * the same resolved display / adornments / toolbar sources as the card branch
 * of BaseNode, so a node looks and behaves identically in both views. The card,
 * circle, and rectangle code paths never reach here.
 */
function BaseNodeBarComponent({
  nodeId,
  width,
  height,
  mode,
  selected,
  dragging,
  disabled,
  label,
  subLabel,
  labelTooltip,
  labelBackgroundColor,
  icon,
  loading,
  iconBackground,
  iconColor,
  background,
  shadow = true,
  executionStatus,
  validationStatus,
  suggestionType,
  statusIndicator,
  toolbarConfig,
  multipleNodesSelected,
  stacked,
  extraMenuItems,
  manifestSourceHandleIds,
  manifestTargetHandleIds,
  onLabelChange,
  onActionNeeded,
}: BaseNodeBarProps) {
  const { _ } = useSafeLingui();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Same priority as BaseContainer: suggestion > validation > execution. The
  // status border stays the border channel; selection stays the outline channel.
  const activeStatus = suggestionType ?? validationStatus ?? executionStatus;
  const statusBorder = getStatusBorder(activeStatus);
  const hasStatusBorder = statusBorder.length > 0;

  const isActionNeeded = executionStatus === 'ActionNeeded';

  // Kebab items are the resolved toolbar actions (design-mode delete/duplicate/
  // etc.), flattened from the same NodeToolbarConfig the card toolbar consumes,
  // with the extraMenuItems (Sequential Canvas move actions) appended after
  // a divider when both groups are present.
  const menuItems = useMemo<NodeMenuItem[]>(() => {
    const toolbarItems: NodeMenuItem[] = !toolbarConfig
      ? []
      : [...toolbarConfig.actions, ...(toolbarConfig.overflowActions ?? [])].map<NodeMenuItem>(
          (action) => {
            if (!('onAction' in action)) {
              return { type: 'divider' };
            }
            return {
              id: action.id,
              label: action.label ?? action.id,
              icon:
                typeof action.icon === 'string' ? (
                  <CanvasIcon icon={action.icon} size={16} />
                ) : (
                  action.icon
                ),
              disabled: action.disabled,
              onClick: () => action.onAction(nodeId),
            };
          }
        );

    if (!extraMenuItems || extraMenuItems.length === 0) return toolbarItems;
    if (toolbarItems.length === 0) return extraMenuItems;
    return [...toolbarItems, { type: 'divider' }, ...extraMenuItems];
  }, [toolbarConfig, nodeId, extraMenuItems]);

  const showKebab =
    menuItems.length > 0 && !multipleNodesSelected && (isHovered || selected || menuOpen);

  const className = cn(
    SEQ_BAR_SHELL_CLASS,
    'cursor-pointer',
    shadow && 'shadow-(--canvas-node-shadow-rest)',
    statusBorder,
    shadow && isHovered && 'shadow-(--canvas-node-shadow-hover)',
    isHovered && !hasStatusBorder && 'border-border-hover',
    selected && 'outline outline-2 outline-foreground-accent-muted',
    disabled && 'opacity-50 cursor-not-allowed',
    dragging && cn('cursor-grabbing', shadow && 'shadow-(--canvas-node-shadow-lifted)'),
    stacked && SEQ_BAR_STACKED_LAYER_CLASS
  );

  return (
    <div
      className={className}
      style={{ ...getSeqBarVars(width, height), background }}
      data-testid="sequential-bar"
      data-execution-status={executionStatus}
      data-validation-status={validationStatus}
      data-suggestion-type={suggestionType}
      data-stacked={stacked || undefined}
      aria-busy={loading || undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        id={SEQUENTIAL_BAR_HANDLE_IDS.target}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      {/* Mid-left entry for branch-entry connectors (no left-offset: a Left
          handle already anchors at the bar's left edge, vertically centered). */}
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
      />
      {manifestTargetHandleIds?.map((hid) =>
        hid === SEQUENTIAL_BAR_HANDLE_IDS.target ? null : (
          <Handle
            key={`mt-${hid}`}
            type="target"
            position={Position.Top}
            id={hid}
            isConnectable={false}
            style={INVISIBLE_HANDLE_STYLE}
          />
        )
      )}

      {iconBackground && (
        // Left accent stripe painted as an inset box-shadow on a bar-sized
        // overlay so it follows the bar's rounded corners exactly. A plain
        // `w-1` strip can't carry a matching corner radius (its 4px width clamps
        // the curve), so its square corners poked past the rounded bar edge.
        // `-inset-px` grows the overlay to the border-box edge (the overlay
        // paints on top of the border), so the stripe sits flush against the
        // selection outline instead of leaving the 1px border as a dark gap.
        <span
          aria-hidden
          data-testid="sequential-bar-accent"
          className="absolute -inset-px rounded-(--node-radius) pointer-events-none"
          style={{ boxShadow: `inset 4px 0 0 ${iconBackground}` }}
        />
      )}

      {(icon || loading) && (
        <div className="shrink-0">
          <BaseInnerShape color={iconColor} background={iconBackground} loading={loading}>
            {loading ? null : icon}
          </BaseInnerShape>
        </div>
      )}

      <NodeLabel
        label={label}
        subLabel={subLabel}
        labelTooltip={labelTooltip}
        labelBackgroundColor={labelBackgroundColor}
        shape="rectangle"
        selected={selected}
        dragging={dragging}
        readonly={mode !== 'design'}
        onChange={onLabelChange}
      />

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {isActionNeeded ? (
          <button
            type="button"
            className="nodrag flex h-6 cursor-pointer items-center gap-1 rounded-full bg-amber-400 px-2 text-[11px] font-semibold text-stone-900 shadow-sm transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            onClick={(e) => {
              e.stopPropagation();
              onActionNeeded?.(nodeId);
            }}
          >
            <CanvasIcon icon="flag" size={12} />
            <span className="whitespace-nowrap">
              {_({ id: 'sequential-canvas.action-needed', message: 'Action needed' })}
            </span>
          </button>
        ) : (
          statusIndicator
        )}
        {showKebab && (
          <CanvasDropdownMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            menuItems={menuItems}
            onItemClick={(item) => item.onClick()}
            triggerAriaLabel={_({ id: 'sequential-canvas.more-options', message: 'More options' })}
          />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id={SEQUENTIAL_BAR_HANDLE_IDS.source}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      {manifestSourceHandleIds?.map((hid) =>
        hid === SEQUENTIAL_BAR_HANDLE_IDS.source ? null : (
          <Handle
            key={`ms-${hid}`}
            type="source"
            position={Position.Bottom}
            id={hid}
            isConnectable={false}
            style={INVISIBLE_HANDLE_STYLE}
          />
        )
      )}
    </div>
  );
}

export const BaseNodeBar = memo(BaseNodeBarComponent);
