import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react';
import { NODE_TEXT_BOTTOM_OFFSET, NODE_TEXT_BOTTOM_OFFSET_WITH_HANDLES } from '../../constants';
import type { NodeShape } from '../../schema';
import { cx } from '../../utils/CssUtil';
import { CanvasTooltip } from '../CanvasTooltip';

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
  if (shape === 'rectangle') {
    return <div className="flex flex-1 min-w-0 flex-col items-start text-left">{children}</div>;
  }
  return (
    <div
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
  children: React.ReactNode;
}

const ConditionalTooltip = ({ content, children }: ConditionalTooltipProps) => {
  if (!content) {
    return children;
  }

  return (
    <CanvasTooltip delay placement="top" content={content} smartTooltip>
      {children}
    </CanvasTooltip>
  );
};

interface HeaderProps {
  shape?: NodeShape;
  backgroundColor?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  'data-testid'?: string;
}

const Header = ({
  shape,
  backgroundColor,
  onDoubleClick,
  children,
  'data-testid': dataTestId,
}: HeaderProps) => (
  // biome-ignore lint/a11y/noStaticElementInteractions: double-click-to-edit is the existing UX
  <div
    data-testid={dataTestId}
    onDoubleClick={onDoubleClick}
    className={cx(
      'text-center text-sm leading-[18px] font-semibold text-foreground overflow-hidden',
      backgroundColor && 'px-1.5 py-0.5 rounded-sm',
      shape === 'rectangle'
        ? 'w-full text-left whitespace-nowrap text-ellipsis'
        : 'wrap-break-word line-clamp-3'
    )}
    style={backgroundColor ? { backgroundColor } : undefined}
  >
    {children}
  </div>
);

interface SubHeaderProps {
  shape?: NodeShape;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  'data-testid'?: string;
}

const SubHeader = ({
  shape,
  onDoubleClick,
  children,
  'data-testid': dataTestId,
}: SubHeaderProps) => (
  // biome-ignore lint/a11y/noStaticElementInteractions: double-click-to-edit is the existing UX
  <div
    data-testid={dataTestId}
    onDoubleClick={onDoubleClick}
    className={cx(
      'text-center text-xs leading-[18px] text-foreground-muted wrap-break-word overflow-hidden',
      shape === 'rectangle' ? 'w-full text-left line-clamp-2' : 'line-clamp-5'
    )}
  >
    {children}
  </div>
);

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
        'nodrag nowheel resize-none font-[inherit] text-foreground border-none rounded-sm outline-1 outline-dashed outline-border-de-emp max-w-full',
        variant === 'subtext'
          ? 'text-xs leading-[18px] font-normal mb-0'
          : 'text-sm leading-[18px] font-semibold mb-0.5',
        shape === 'rectangle' ? 'field-sizing-fixed w-full' : 'field-sizing-content text-center',
        backgroundColor && 'px-1.5 py-0.5'
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
    />
  )
);
EditableLabel.displayName = 'EditableLabel';

interface EmptyLabelPlaceholderProps {
  onDoubleClick?: (e: React.MouseEvent) => void;
}

const EmptyLabelPlaceholder = ({ onDoubleClick }: EmptyLabelPlaceholderProps) => (
  <button
    type="button"
    onDoubleClick={onDoubleClick}
    className="nodrag nowheel text-sm leading-[18px] font-semibold text-foreground-muted bg-transparent border border-dashed border-border-de-emp rounded-sm cursor-pointer opacity-0 transition-opacity duration-200 min-w-5 min-h-5 hover:opacity-100"
    aria-label="Add node label"
    data-testid="empty-label-placeholder"
  />
);

export interface NodeLabelProps {
  label?: string;
  subLabel?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  shape?: NodeShape;
  hasBottomHandles?: boolean;
  selected?: boolean;
  dragging?: boolean;
  centerAdornment?: React.ReactNode;
  readonly?: boolean;
  onChange?: (values: { label: string; subLabel: string }) => void;
}

const NodeLabelInternal = ({
  label = '',
  subLabel = '',
  labelTooltip,
  labelBackgroundColor,
  shape,
  hasBottomHandles,
  selected,
  dragging,
  centerAdornment,
  readonly,
  onChange,
}: NodeLabelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState('');
  const [localSubLabel, setLocalSubLabel] = useState('');
  const [focusTarget, setFocusTarget] =
    useState<React.RefObject<HTMLTextAreaElement | null> | null>(null);

  const labelInputRef = useRef<HTMLTextAreaElement>(null);
  const subLabelInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    setFocusTarget(null);

    // Only call onChange if values have changed
    if (localLabel !== label || localSubLabel !== subLabel) {
      onChange?.({
        label: localLabel,
        subLabel: localSubLabel,
      });
    }
  }, [localLabel, localSubLabel, label, subLabel, onChange]);

  const startEditing = useCallback(
    (targetRef: React.RefObject<HTMLTextAreaElement | null>) => {
      setIsEditing(true);
      setLocalLabel(label);
      setLocalSubLabel(subLabel);
      setFocusTarget(targetRef);
    },
    [label, subLabel]
  );

  const handleDoubleClick = useCallback(
    (targetRef: React.RefObject<HTMLTextAreaElement | null>) => (e: React.MouseEvent) => {
      e.stopPropagation();
      startEditing(targetRef);
    },
    [startEditing]
  );

  // Focus the appropriate input when editing starts
  useEffect(() => {
    if (isEditing && focusTarget?.current) {
      focusTarget.current.focus();
      focusTarget.current.select();
    }
  }, [isEditing, focusTarget]);

  // Exit edit mode when node is deselected, dragged, or set to readonly
  useEffect(() => {
    if (isEditing && (!selected || dragging || readonly)) {
      handleSave();
    }
  }, [selected, dragging, isEditing, readonly, handleSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setFocusTarget(null);
    setLocalLabel(label);
    setLocalSubLabel(subLabel);
  }, [label, subLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // Check if focus is moving to another input within the editing area
      const relatedTarget = e.relatedTarget as HTMLElement | null;

      // If moving to the other label input, don't save yet
      if (relatedTarget === labelInputRef.current || relatedTarget === subLabelInputRef.current) {
        return;
      }

      // Save on blur when clicking outside the editing inputs
      handleSave();
    },
    [handleSave]
  );

  if (!label && !subLabel && !isEditing) {
    return (
      <BaseTextContainer hasBottomHandles={hasBottomHandles} shape={shape}>
        <EmptyLabelPlaceholder
          onDoubleClick={readonly ? undefined : handleDoubleClick(labelInputRef)}
        />
        {centerAdornment}
      </BaseTextContainer>
    );
  }

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
            placeholder="Name"
            rows={shape === 'rectangle' ? 1 : undefined}
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
            placeholder="Description"
            rows={shape === 'rectangle' ? 2 : undefined}
            aria-label="Edit node description"
          />
        </>
      ) : (
        <ConditionalTooltip content={labelTooltip}>
          <Header
            shape={shape}
            backgroundColor={labelBackgroundColor}
            onDoubleClick={readonly ? undefined : handleDoubleClick(labelInputRef)}
            data-testid="node-label"
          >
            {label}
          </Header>
          {subLabel && (
            <SubHeader
              shape={shape}
              onDoubleClick={readonly ? undefined : handleDoubleClick(subLabelInputRef)}
              data-testid="node-sublabel"
            >
              {subLabel}
            </SubHeader>
          )}
        </ConditionalTooltip>
      )}
      {centerAdornment}
    </BaseTextContainer>
  );
};

export const NodeLabel = memo(NodeLabelInternal);
