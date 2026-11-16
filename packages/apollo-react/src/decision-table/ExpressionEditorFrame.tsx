import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { activeElementOf, hasLostFocus, isComposing } from './gridEvents';
import type { ExpressionEditorHandle, ExpressionEditorProps } from './valueTypes';

const FRAME_KEYS: ReadonlySet<string> = new Set(['Enter', 'Escape', 'Tab']);

const isShiftTab = (event: React.KeyboardEvent): boolean => event.key === 'Tab' && event.shiftKey;

export interface ExpressionEditorFrameProps extends Omit<ExpressionEditorProps, 'onReady'> {
  renderEditor: (props: ExpressionEditorProps) => React.ReactNode;
  onApply: () => void;
  onCancel: () => void;
}

/** Holds an expression editor in the popover: focus on open and from a press around it, Enter applies, Escape cancels and Tab moves, unless the editor owns the key; focus waits on the frame until the editor is ready. */
export const ExpressionEditorFrame: React.FC<ExpressionEditorFrameProps> = ({
  renderEditor,
  onApply,
  onCancel,
  ...editor
}) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ExpressionEditorHandle | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback((handle: ExpressionEditorHandle | null) => {
    const frame = frameRef.current;
    const waiting = frame !== null && (activeElementOf(frame) === frame || hasLostFocus(frame));
    handleRef.current = handle;
    setReady(handle !== null);
    if (waiting) handle?.focus();
  }, []);
  useLayoutEffect(() => {
    (handleRef.current ?? frameRef.current)?.focus();
  }, []);
  const onKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!FRAME_KEYS.has(event.key)) return;
    if (!isShiftTab(event) && handleRef.current?.ownsKeys?.()) return;
    event.stopPropagation();
    if (isComposing(event) || event.key === 'Tab') return;
    event.preventDefault();
    if (event.key === 'Escape') onCancel();
    else onApply();
  };
  return (
    <div
      ref={frameRef}
      tabIndex={ready ? -1 : 0}
      onFocus={(event) => {
        if (event.target === event.currentTarget) handleRef.current?.focus();
      }}
      onKeyDownCapture={onKeyDownCapture}
    >
      {renderEditor({ ...editor, onReady })}
    </div>
  );
};
