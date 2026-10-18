import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH, SEQ_HANDLE_LEFT_OFFSET } from '../../constants';
import type { NodeShape } from '../../schema';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import type { NodeMenuItem } from '../NodeContextMenu';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';
import type { NodeToolbarConfig } from '../Toolbar';
import type { NodeAdornments } from './BaseNode.types';
import {
  getInteractionClasses,
  getStatusBorder,
  resolveInteractionState,
  STACKED_LAYER_CLASS,
} from './BaseNodeContainer';
import { BaseInnerShape } from './BaseNodeInnerShape';
import { NodeLabel, type NodeLabelProps } from './NodeLabel';

/** Chips shown before the overflow chip takes over. */
const MAX_VISIBLE_ATTACHMENTS = 3;

const SEQ_BAR_VARS = {
  '--node-w': `${SEQ_BAR_WIDTH}px`,
  '--node-h': `${SEQ_BAR_HEIGHT}px`,
  '--node-radius': '12px',
  '--inner-w': '32px',
  '--inner-h': '32px',
  '--inner-radius': '8px',
  '--icon-size': '16px',
} as React.CSSProperties;

/** Icon tile radius for a card shape, mirroring the card's inner-shape rule. */
export function seqBarInnerRadius(shape: NodeShape | undefined): string {
  if (shape === 'circle') return '50%';
  if (shape === 'pill') return '9999px';
  return '8px';
}

/**
 * Bar geometry as CSS custom properties, shared by BaseNodeBar and the synthetic
 * start / placeholder bars so all three render at an identical size. `shape` is the
 * node's card shape and only affects the icon tile radius.
 */
export function getSeqBarVars(
  width = SEQ_BAR_WIDTH,
  height = SEQ_BAR_HEIGHT,
  shape?: NodeShape
): React.CSSProperties {
  return {
    ...SEQ_BAR_VARS,
    '--node-w': `${width}px`,
    '--node-h': `${height}px`,
    '--inner-radius': seqBarInnerRadius(shape),
  } as React.CSSProperties;
}

/** Static bar shell classes; shadow, status, hover, and selection classes layer on per instance. */
export const SEQ_BAR_SHELL_CLASS =
  'relative flex flex-row items-center gap-2 px-3 bg-surface-overlay border border-border w-(--node-w) h-(--node-h) rounded-(--node-radius) outline-offset-0 transition-[box-shadow,border-color] duration-150';

/** Handle ids every sequential bar exposes; connectors wire row N `source` to row N+1 `target`. */
export const SEQUENTIAL_BAR_HANDLE_IDS = {
  target: 'seq-target',
  source: 'seq-source',
  // Mid-left target for `branch-entry` connectors: a lane's first row is entered
  // from the left at mid-height so the elbow off the owner's spine reads as an indent.
  branchTarget: 'seq-branch-target',
} as const;

/**
 * Transparent 8px handles: bars are not user-connectable. The spine handles pin
 * `left` to `SEQ_HANDLE_LEFT_OFFSET` (xyflow's own transform still centers them);
 * a Left-positioned branch handle already sits at the bar edge and needs no offset.
 */
export const INVISIBLE_BRANCH_HANDLE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
};

export const INVISIBLE_HANDLE_STYLE: React.CSSProperties = {
  ...INVISIBLE_BRANCH_HANDLE_STYLE,
  left: SEQ_HANDLE_LEFT_OFFSET,
};

export interface BaseNodeBarAttachment {
  /** Canonical id of the attached resource node. */
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Artifact handle on the owning step the resource is wired to (e.g. `tools`). */
  handleId?: string;
}

export interface BaseNodeBarProps {
  nodeId: string;
  width?: number;
  height?: number;
  /** The node's card shape; the bar keeps its own geometry but rounds the icon tile to match. */
  shape?: NodeShape;
  mode?: 'design' | 'view' | 'readonly';
  /** Per-node lock (BaseCanvas `readOnlyNodeIds`); composes with `mode`. Pass `toolbarConfig` already locked. */
  locked?: boolean;
  selected?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  label?: string;
  subLabel?: NodeLabelProps['subLabel'];
  labelPlaceholder?: string;
  subLabelPlaceholder?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  /** Rendered inline after the label, truncated to fit the fixed bar height. */
  footer?: React.ReactNode;
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
  /**
   * Same resolved adornments as the card. Left corners overlay the icon tile,
   * right corners sit in the trailing group; topRight yields to the Action needed pill.
   */
  adornments?: NodeAdornments;
  /** Same resolved toolbar as the card; its actions feed the kebab menu. */
  toolbarConfig?: NodeToolbarConfig;
  /** Hides the kebab during rubber-band multi-select, like the card toolbar. */
  multipleNodesSelected?: boolean;
  /**
   * Collapsed collapsible row. Driven by view-local state through context, never
   * `node.data`, so the sequential clone's data stays reference-stable.
   */
  stacked?: boolean;
  /** Extra kebab items appended after the toolbar actions, with a divider when both groups are non-empty. */
  extraMenuItems?: NodeMenuItem[];
  /**
   * Manifest handle ids rendered as extra invisible anchors. The Add Node
   * validator resolves handles by id against the manifest, so the insert preview
   * must anchor on a handle id the bar actually renders.
   */
  manifestSourceHandleIds?: string[];
  manifestTargetHandleIds?: string[];
  /**
   * Resource nodes attached through artifact edges (tools, context, memory).
   * Flow view shows them as separate nodes; the bar shows them as chips.
   */
  attachments?: BaseNodeBarAttachment[];
  onLabelChange?: (values: { label: string; subLabel: string }) => void;
  onActionNeeded?: (nodeId: string) => void;
}

function AttachmentChip({
  tooltip,
  testId = 'sequential-bar-attachment',
  children,
}: {
  tooltip: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <CanvasTooltip content={tooltip} delay disableHoverableContent>
      <span
        data-testid={testId}
        className="inline-flex h-6 max-w-32 items-center gap-1 rounded-full border border-border bg-surface px-2 text-[11px] text-foreground-muted"
      >
        {children}
      </span>
    </CanvasTooltip>
  );
}

/** Invisible manifest handles so the Add Node validator can resolve ids the bar renders. */
function ManifestHandles({
  ids,
  type,
  position,
  skipId,
}: {
  ids: string[] | undefined;
  type: 'source' | 'target';
  position: Position;
  skipId: string;
}) {
  return ids?.map((hid) =>
    hid === skipId ? null : (
      <Handle
        key={`${type}-${hid}`}
        type={type}
        position={position}
        id={hid}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
    )
  );
}

/**
 * Horizontal bar rendering of a node for the Sequential Canvas view. Resolves
 * display, adornments, and toolbar through useBaseNodePresentation exactly as
 * BaseNode does, so toggling views loses no feature.
 */
function BaseNodeBarComponent({
  nodeId,
  width,
  height,
  mode,
  locked,
  selected,
  dragging,
  disabled,
  label,
  subLabel,
  labelPlaceholder,
  subLabelPlaceholder,
  labelTooltip,
  labelBackgroundColor,
  footer,
  icon,
  loading,
  iconBackground,
  iconColor,
  background,
  shadow = true,
  executionStatus,
  validationStatus,
  suggestionType,
  adornments,
  toolbarConfig,
  multipleNodesSelected,
  stacked,
  extraMenuItems,
  manifestSourceHandleIds,
  manifestTargetHandleIds,
  attachments,
  onLabelChange,
  onActionNeeded,
  shape,
}: BaseNodeBarProps) {
  const { _ } = useSafeLingui();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The card draws nothing distinct for 'focus' either.
  const interactionState = resolveInteractionState({
    disabled,
    dragging,
    selected,
    focused: isFocused,
    hovered: isHovered,
  });

  const hasOverflow = (attachments?.length ?? 0) > MAX_VISIBLE_ATTACHMENTS;
  const visibleAttachments = hasOverflow
    ? attachments!.slice(0, MAX_VISIBLE_ATTACHMENTS)
    : (attachments ?? []);
  const overflowAttachments = hasOverflow ? attachments!.slice(MAX_VISIBLE_ATTACHMENTS) : [];

  // Same priority as BaseContainer: suggestion > validation > execution.
  const activeStatus = suggestionType ?? validationStatus ?? executionStatus;

  const isActionNeeded = executionStatus === 'ActionNeeded';

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
    menuItems.length > 0 &&
    !multipleNodesSelected &&
    !dragging &&
    (isHovered || selected || menuOpen);

  // Memoized like BaseContainer: `cn()` merges a long class list, and bars re-render on
  // hover and selection only, so the result is reused across unrelated renders.
  const className = useMemo(
    () =>
      cn(
        SEQ_BAR_SHELL_CLASS,
        'cursor-pointer',
        shadow && 'shadow-(--canvas-node-shadow-rest)',
        getInteractionClasses({
          statusBorder: getStatusBorder(activeStatus),
          isHovered,
          isSelected: selected,
          interactionState,
          shadow,
        }),
        stacked && STACKED_LAYER_CLASS
      ),
    [shadow, activeStatus, isHovered, selected, interactionState, stacked]
  );
  const style = useMemo(
    () => ({ ...getSeqBarVars(width, height, shape), background }),
    [width, height, shape, background]
  );

  return (
    <div
      className={className}
      style={style}
      data-testid="sequential-bar"
      data-execution-status={executionStatus}
      data-validation-status={validationStatus}
      data-suggestion-type={suggestionType}
      data-stacked={stacked || undefined}
      data-interaction-state={interactionState}
      aria-busy={loading || undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        id={SEQUENTIAL_BAR_HANDLE_IDS.target}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={INVISIBLE_BRANCH_HANDLE_STYLE}
      />
      <ManifestHandles
        ids={manifestTargetHandleIds}
        type="target"
        position={Position.Top}
        skipId={SEQUENTIAL_BAR_HANDLE_IDS.target}
      />

      {iconBackground && (
        // Inset box-shadow rather than a `w-1` strip so the stripe follows the bar's
        // rounded corners; `-inset-px` covers the border so no 1px gap shows.
        <span
          aria-hidden
          data-testid="sequential-bar-accent"
          className="absolute -inset-px rounded-(--node-radius) pointer-events-none shadow-[inset_4px_0_0_var(--seq-accent)]"
          style={{ '--seq-accent': iconBackground } as React.CSSProperties}
        />
      )}

      {(icon || loading || adornments?.topLeft || adornments?.bottomLeft) && (
        <div className="relative shrink-0">
          <BaseInnerShape color={iconColor} background={iconBackground} loading={loading}>
            {loading ? null : icon}
          </BaseInnerShape>
          {adornments?.topLeft && (
            <div
              data-testid="sequential-bar-adornment-top-left"
              className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center"
            >
              {adornments.topLeft}
            </div>
          )}
          {adornments?.bottomLeft && (
            <div
              data-testid="sequential-bar-adornment-bottom-left"
              className="absolute -bottom-1.5 -left-1.5 flex size-5 items-center justify-center"
            >
              {adornments.bottomLeft}
            </div>
          )}
        </div>
      )}

      <NodeLabel
        label={label}
        subLabel={subLabel}
        labelPlaceholder={labelPlaceholder}
        subLabelPlaceholder={subLabelPlaceholder}
        labelTooltip={labelTooltip}
        labelBackgroundColor={labelBackgroundColor}
        shape="rectangle"
        selected={selected}
        dragging={dragging}
        readonly={mode !== 'design' || locked}
        discardDraftOnReadonly={locked}
        onChange={onLabelChange}
      />

      {footer && (
        <div
          data-testid="sequential-bar-footer"
          className="min-w-0 shrink truncate text-xs text-foreground-muted"
        >
          {footer}
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {visibleAttachments.map((attachment) => (
          <AttachmentChip key={attachment.id} tooltip={attachment.label}>
            {attachment.icon && <span className="shrink-0 [&_svg]:size-3">{attachment.icon}</span>}
            <span className="truncate">{attachment.label}</span>
          </AttachmentChip>
        ))}
        {hasOverflow && (
          <AttachmentChip
            tooltip={overflowAttachments.map((attachment) => attachment.label).join(', ')}
            testId="sequential-bar-attachment-overflow"
          >
            +{overflowAttachments.length}
          </AttachmentChip>
        )}
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
          adornments?.topRight && (
            <div
              data-testid="sequential-bar-adornment-top-right"
              className="flex items-center justify-center"
            >
              {adornments.topRight}
            </div>
          )
        )}
        {adornments?.bottomRight && (
          <div
            data-testid="sequential-bar-adornment-bottom-right"
            className="flex items-center justify-center"
          >
            {adornments.bottomRight}
          </div>
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
      <ManifestHandles
        ids={manifestSourceHandleIds}
        type="source"
        position={Position.Bottom}
        skipId={SEQUENTIAL_BAR_HANDLE_IDS.source}
      />
    </div>
  );
}

export const BaseNodeBar = memo(BaseNodeBarComponent);
