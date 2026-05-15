import { cn } from '@uipath/apollo-wind';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CanvasTooltip } from '../CanvasTooltip';

type StageTitleInputProps = {
  label: string;
  onChange?: (next: string) => void;
  className?: string;
};

export const StageTitleInput = ({
  label: labelProp,
  onChange,
  className,
}: StageTitleInputProps) => {
  const isEditable = !!onChange;
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(labelProp);

  useEffect(() => {
    setLabel(labelProp);
  }, [labelProp]);

  useLayoutEffect(() => {
    if (isEditing && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      const caret = input.value.length;
      input.setSelectionRange(caret, caret);
    }
  }, [isEditing]);

  const handleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setLabel((e.target as HTMLInputElement).value);
  }, []);

  const saveStageTitle = useCallback(() => {
    setIsEditing(false);
    if (!onChange) return;
    const finalLabel = label.trim() === '' ? 'Untitled Stage' : label;
    if (finalLabel !== label) setLabel(finalLabel);
    onChange(finalLabel);
  }, [onChange, label]);

  const handleBlur = useCallback(() => {
    if (isEditing) saveStageTitle();
  }, [isEditing, saveStageTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') saveStageTitle();
      // Prevent keyboard events from the title input from bubbling to xyflow
      // and triggering canvas-level actions like node deletion or copy/paste.
      if (e.key !== 'Escape') e.stopPropagation();
    },
    [saveStageTitle]
  );

  return (
    <div className={cn('py-0.5 text-sm', !isEditing && 'font-bold', className)}>
      <CanvasTooltip content={label} placement="top" hide={isEditing} delay>
        <div
          className={cn(
            'flex min-h-7 w-full items-center rounded',
            isEditing && 'outline outline-1 -outline-offset-1 outline-[var(--canvas-border-de-emp)]'
          )}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              name="Stage Title"
              value={label}
              onInput={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={cn(
                'nodrag w-full min-w-[100px] py-1',
                'cursor-text rounded-sm border-none bg-transparent text-sm text-ellipsis',
                'focus:outline-none',
                'hover:bg-[var(--canvas-background-secondary)]'
              )}
            />
          ) : isEditable ? (
            <button
              type="button"
              className={cn(
                'nodrag flex w-full min-w-0 items-center self-stretch rounded-sm',
                'appearance-none border-none bg-transparent p-0 text-left text-sm font-bold',
                'cursor-text hover:bg-[var(--canvas-background-secondary)]'
              )}
              onClick={() => setIsEditing(true)}
            >
              <span className="truncate">{label}</span>
            </button>
          ) : (
            <span className="inline-block max-w-full truncate rounded-sm py-1">{label}</span>
          )}
        </div>
      </CanvasTooltip>
    </div>
  );
};
