import { forwardRef, memo } from 'react';
import { NODE_TEXT_BOTTOM_OFFSET, NODE_TEXT_BOTTOM_OFFSET_WITH_HANDLES } from '../../constants';
import { isWideNodeShape, type NodeLabelLines, type NodeShape } from '../../schema';
import { cx } from '../../utils/CssUtil';
import { CanvasTooltip } from '../CanvasTooltip';
import { useInlineLabelEditing } from './useInlineLabelEditing';

interface BaseTextContainerProps {
  hasBottomHandles?: boolean;
  shape?: NodeShape;
  children: React.ReactNode;
}

export const BaseTextContainer = ({
  hasBottomHandles,
  shape,
  children,
}: BaseTextContainerProps) => {
  if (isWideNodeShape(shape)) {
    return (
      <div data-node-part="label" className="flex flex-1 min-w-0 flex-col items-start text-left">
        {children}
      </div>
    );
  }
  return (
    <div
      data-node-part="label"
      className={cx(
        'absolute left-1/2 w-[150%] flex flex-col z-10 transition-transform duration-200',
        hasBottomHandles
          ? 'items-start text-left translate-x-[20%] translate-y-1/2'
          : 'items-center text-center -translate-x-1/2 translate-y-full'
      )}
      style={{
        bottom: hasBottomHandles ? NODE_TEXT_BOTTOM_OFFSET_WITH_HANDLES : NODE_TEXT_BOTTOM_OFFSET,
      }}
    >
      {children}
    </div>
  );
};

interface ConditionalTooltipProps {
  content?: string;
  placement?: 'top' | 'bottom';
  children: React.ReactNode;
}

const ConditionalTooltip = ({ content, placement = 'top', children }: ConditionalTooltipProps) => {
  if (!content) {
    return children;
  }

  return (
    <CanvasTooltip delay placement={placement} content={content} smartTooltip>
      {children}
    </CanvasTooltip>
  );
};

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: NodeShape;
  /** Lines a wide node's name may take before it's cut off with "…". */
  lines?: number;
  backgroundColor?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
  'data-testid'?: string;
}

const Header = forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      shape,
      lines = 1,
      backgroundColor,
      onDoubleClick,
      children,
      className,
      style,
      'data-testid': dataTestId,
      ...triggerProps
    },
    ref
  ) => (
    <div
      {...triggerProps}
      ref={ref}
      data-testid={dataTestId}
      onDoubleClick={onDoubleClick}
      className={cx(
        'text-center text-sm leading-[18px] font-semibold text-foreground overflow-hidden',
        backgroundColor && 'px-1.5 py-0.5 rounded-sm',
        isWideNodeShape(shape)
          ? lines > 1
            ? 'w-full text-left wrap-break-word line-clamp-(--node-label-lines)'
            : 'w-full text-left whitespace-nowrap text-ellipsis'
          : 'wrap-break-word line-clamp-3',
        className
      )}
      style={
        {
          ...style,
          ...(isWideNodeShape(shape) && lines > 1 ? { '--node-label-lines': lines } : undefined),
          ...(backgroundColor ? { backgroundColor } : undefined),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
);
Header.displayName = 'Header';

interface SubHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: NodeShape;
  /** Lines a wide node's description may take: 2, or 1 when the name takes more than one. */
  lines?: 1 | 2;
  onDoubleClick?: (e: React.MouseEvent) => void;
  'data-testid'?: string;
}

const SubHeader = forwardRef<HTMLDivElement, SubHeaderProps>(
  (
    {
      shape,
      lines = 2,
      onDoubleClick,
      children,
      className,
      style,
      'data-testid': dataTestId,
      ...triggerProps
    },
    ref
  ) => (
    <div
      {...triggerProps}
      ref={ref}
      data-testid={dataTestId}
      onDoubleClick={onDoubleClick}
      className={cx(
        'text-center text-xs leading-[18px] text-foreground-muted wrap-break-word overflow-hidden whitespace-pre-line',
        isWideNodeShape(shape)
          ? lines === 1
            ? 'w-full text-left line-clamp-1'
            : 'w-full text-left line-clamp-2'
          : 'line-clamp-5',
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
);
SubHeader.displayName = 'SubHeader';

interface EditableLabelProps {
  shape?: NodeShape;
  backgroundColor?: string;
  variant: 'normal' | 'subtext';
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  'aria-label'?: string;
}

const EditableLabel = forwardRef<HTMLTextAreaElement, EditableLabelProps>(
  (
    {
      shape,
      backgroundColor,
      variant,
      value,
      placeholder,
      rows,
      onChange,
      onKeyDown,
      onBlur,
      'aria-label': ariaLabel,
    },
    ref
  ) => (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cx(
        'nodrag nowheel resize-none font-[inherit] text-foreground border-none rounded-sm outline-1 outline-dashed outline-border-de-emp max-w-full px-1.5',
        variant === 'subtext'
          ? 'text-xs leading-[18px] font-normal mb-0'
          : 'text-sm leading-[18px] font-semibold mb-0.5',
        isWideNodeShape(shape) ? 'field-sizing-fixed w-full' : 'field-sizing-content text-center',
        backgroundColor && 'py-0.5'
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
    />
  )
);
EditableLabel.displayName = 'EditableLabel';

interface EmptyLabelPlaceholderProps {
  disabled?: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

// `disabled` keeps the placeholder out of the tab order when read-only, so it
// can't be focused to announce an action it won't perform.
const EmptyLabelPlaceholder = ({ disabled, onDoubleClick }: EmptyLabelPlaceholderProps) => (
  <button
    type="button"
    disabled={disabled}
    onDoubleClick={onDoubleClick}
    className="nodrag nowheel text-sm leading-[18px] font-semibold text-foreground-muted bg-transparent border border-dashed border-border-de-emp rounded-sm cursor-pointer opacity-0 transition-opacity duration-200 min-w-5 min-h-5 hover:opacity-100"
    aria-label="Add node label"
    data-testid="empty-label-placeholder"
  />
);

export interface NodeLabelProps {
  label?: string;
  subLabel?: string;
  /** Hint shown in the name editor while empty. Defaults to `"Name"`. */
  labelPlaceholder?: string;
  /** Hint shown in the description editor while empty. Defaults to `"Description"`. */
  subLabelPlaceholder?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  shape?: NodeShape;
  /**
   * Lines a wide node's name may take before it's cut off with "…" (default 1). The full name
   * shows in a tooltip when it's cut off. With two or more, the description takes one line
   * instead of two. Other shapes always wrap their name below the node.
   */
  labelLines?: NodeLabelLines;
  hasBottomHandles?: boolean;
  selected?: boolean;
  dragging?: boolean;
  centerAdornment?: React.ReactNode;
  readonly?: boolean;
  /** Discard rather than commit an in-progress edit when `readonly` turns on. */
  discardDraftOnReadonly?: boolean;
  onChange?: (values: { label: string; subLabel: string }) => void;
}

const NodeLabelInternal = ({
  label = '',
  subLabel = '',
  labelPlaceholder = 'Name',
  subLabelPlaceholder = 'Description',
  labelTooltip,
  labelBackgroundColor,
  shape,
  labelLines = 1,
  hasBottomHandles,
  selected,
  dragging,
  centerAdornment,
  readonly,
  discardDraftOnReadonly,
  onChange,
}: NodeLabelProps) => {
  const {
    isEditing,
    localLabel,
    setLocalLabel,
    localSubLabel,
    setLocalSubLabel,
    labelInputRef,
    subLabelInputRef,
    handleDoubleClick,
    handleKeyDown,
    handleBlur,
  } = useInlineLabelEditing({
    label,
    subLabel,
    selected,
    dragging,
    readonly,
    discardDraftOnReadonly,
    onChange,
  });

  if (!label && !subLabel && !isEditing) {
    return (
      <BaseTextContainer hasBottomHandles={hasBottomHandles} shape={shape}>
        <EmptyLabelPlaceholder
          disabled={readonly}
          onDoubleClick={readonly ? undefined : handleDoubleClick(labelInputRef)}
        />
        {centerAdornment}
      </BaseTextContainer>
    );
  }

  // A wide node's name and description share about three lines at the smallest height.
  const subLabelLines = labelLines > 1 ? 1 : 2;

  const headerTooltipContent = labelTooltip ?? label;
  const subHeaderTooltipContent = labelTooltip ?? subLabel;

  // Rectangle nodes render the label inside the node body, so a top-placed
  // tooltip sits above the node. Other shapes render the label below the node,
  // where a top-placed tooltip would overlap the node itself, so place it below.
  const tooltipPlacement = isWideNodeShape(shape) ? 'top' : 'bottom';

  return (
    <BaseTextContainer hasBottomHandles={hasBottomHandles} shape={shape}>
      {isEditing ? (
        <>
          <EditableLabel
            ref={labelInputRef}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            shape={shape}
            variant="normal"
            backgroundColor={labelBackgroundColor}
            placeholder={labelPlaceholder}
            rows={isWideNodeShape(shape) ? labelLines : undefined}
            aria-label="Edit node name"
          />
          <EditableLabel
            ref={subLabelInputRef}
            value={localSubLabel}
            onChange={(e) => setLocalSubLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            shape={shape}
            variant="subtext"
            placeholder={subLabelPlaceholder}
            rows={isWideNodeShape(shape) ? subLabelLines : undefined}
            aria-label="Edit node description"
          />
        </>
      ) : (
        <>
          <ConditionalTooltip content={headerTooltipContent} placement={tooltipPlacement}>
            <Header
              shape={shape}
              lines={labelLines}
              backgroundColor={labelBackgroundColor}
              onDoubleClick={readonly ? undefined : handleDoubleClick(labelInputRef)}
              data-testid="node-label"
            >
              {label}
            </Header>
          </ConditionalTooltip>
          {subLabel && (
            <ConditionalTooltip content={subHeaderTooltipContent} placement={tooltipPlacement}>
              <SubHeader
                shape={shape}
                lines={subLabelLines}
                onDoubleClick={readonly ? undefined : handleDoubleClick(subLabelInputRef)}
                data-testid="node-sublabel"
              >
                {subLabel}
              </SubHeader>
            </ConditionalTooltip>
          )}
        </>
      )}
      {centerAdornment}
    </BaseTextContainer>
  );
};

export const NodeLabel = memo(NodeLabelInternal);
