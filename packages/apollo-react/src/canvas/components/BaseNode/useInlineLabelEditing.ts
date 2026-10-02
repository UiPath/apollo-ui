import { useCallback, useEffect, useRef, useState } from 'react';

export interface InlineLabelValues {
  label: string;
  subLabel: string;
}

export interface UseInlineLabelEditingOptions {
  label: string;
  subLabel: string;
  selected?: boolean;
  dragging?: boolean;
  readonly?: boolean;
  /** Discard rather than commit an in-progress edit when `readonly` turns on. */
  discardDraftOnReadonly?: boolean;
  onChange?: (values: InlineLabelValues) => void;
}

type InputRef = React.RefObject<HTMLTextAreaElement | null>;

/**
 * Inline editing state for a node's label and sub-label, shared by BaseNode and
 * ContainerNode. Enter or blur commits, Escape cancels, and deselecting or
 * dragging the node commits. A per-node lock (`discardDraftOnReadonly`)
 * discards the draft instead.
 */
export function useInlineLabelEditing({
  label,
  subLabel,
  selected,
  dragging,
  readonly,
  discardDraftOnReadonly,
  onChange,
}: UseInlineLabelEditingOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState('');
  const [localSubLabel, setLocalSubLabel] = useState('');
  const [focusTarget, setFocusTarget] = useState<InputRef | null>(null);

  const labelInputRef = useRef<HTMLTextAreaElement>(null);
  const subLabelInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    setFocusTarget(null);

    const [nextLabel, nextSubLabel] = [localLabel.trim(), localSubLabel.trim()];
    if (nextLabel !== label || nextSubLabel !== subLabel) {
      onChange?.({
        label: nextLabel,
        subLabel: nextSubLabel,
      });
    }
  }, [localLabel, localSubLabel, label, subLabel, onChange]);

  const startEditing = useCallback(
    (targetRef: InputRef) => {
      setIsEditing(true);
      setLocalLabel(label);
      setLocalSubLabel(subLabel);
      setFocusTarget(targetRef);
    },
    [label, subLabel]
  );

  const handleDoubleClick = useCallback(
    (targetRef: InputRef) => (e: React.MouseEvent) => {
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

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setFocusTarget(null);
    setLocalLabel(label);
    setLocalSubLabel(subLabel);
  }, [label, subLabel]);

  // Exit edit mode when deselected, dragged, or set to readonly. A per-node
  // lock discards the draft: locking is often an execution lock and must not
  // mutate data as a side effect. Every other exit commits.
  useEffect(() => {
    if (!isEditing) return;
    if (readonly && discardDraftOnReadonly) {
      handleCancel();
    } else if (!selected || dragging || readonly) {
      handleSave();
    }
  }, [selected, dragging, isEditing, readonly, discardDraftOnReadonly, handleSave, handleCancel]);

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

  return {
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
  };
}
