import { ApTooltip } from '@uipath/apollo-react/material/components';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { NodeShape } from '../../schema';
import {
  BaseHeader,
  BaseSubHeader,
  BaseTextContainer,
  EditableLabel,
  EmptyLabelPlaceholder,
} from './BaseNode.styles';

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
  onChange: (values: { label: string; subLabel: string }) => void;
}

interface ConditionalTooltipProps {
  content?: string;
  children: React.ReactNode;
}

const ConditionalTooltip = ({ content, children }: ConditionalTooltipProps) => {
  if (!content) {
    return children;
  }

  return (
    <ApTooltip delay placement="top" content={content} smartTooltip>
      {children}
    </ApTooltip>
  );
};

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
      onChange({
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
          className="nodrag nowheel"
          role="button"
          aria-label="Add node label"
          data-testid="empty-label-placeholder"
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
            className="nodrag nowheel"
            placeholder="Name"
            rows={shape === 'rectangle' ? 1 : undefined}
            role="textbox"
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
            className="nodrag nowheel"
            placeholder="Description"
            rows={shape === 'rectangle' ? 2 : undefined}
            role="textbox"
            aria-label="Edit node description"
          />
        </>
      ) : (
        <ConditionalTooltip content={labelTooltip}>
          <BaseHeader
            shape={shape}
            backgroundColor={labelBackgroundColor}
            onDoubleClick={readonly ? undefined : handleDoubleClick(labelInputRef)}
            data-testid="node-label"
          >
            {label}
          </BaseHeader>
          {subLabel && (
            <BaseSubHeader
              shape={shape}
              onDoubleClick={readonly ? undefined : handleDoubleClick(subLabelInputRef)}
              data-testid="node-sublabel"
            >
              {subLabel}
            </BaseSubHeader>
          )}
        </ConditionalTooltip>
      )}
      {centerAdornment}
    </BaseTextContainer>
  );
};

export const NodeLabel = memo(NodeLabelInternal);
