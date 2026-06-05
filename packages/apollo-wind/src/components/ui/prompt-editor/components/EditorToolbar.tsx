import { Bold, Italic, List, ListOrdered, Maximize2, Strikethrough } from 'lucide-react';
import { cn } from '@/lib';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PromptEditorMode, PromptEditorToolbarActionsRef } from '../types';

export interface EditorToolbarProps {
  mode: PromptEditorMode;
  onModeChange: (mode: PromptEditorMode) => void;
  disabled?: boolean;
  actionsRef?: React.RefObject<PromptEditorToolbarActionsRef | null>;
  onFullscreen?: () => void;
}

/**
 * Toolbar formatting button: 28×28 px tap target, 4 px border-radius, 14 px lucide icon.
 */
const ToolbarButton = ({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <span className="text-xs">{label}</span>
    </TooltipContent>
  </Tooltip>
);

const ToolbarSeparator = () => <span aria-hidden className="mx-1 h-4 w-px bg-border/60" />;

export const EditorToolbar = ({
  mode,
  onModeChange,
  disabled,
  actionsRef,
  onFullscreen,
}: EditorToolbarProps) => {
  const isEditMode = mode === 'edit';

  const handleFormat = (actionName: keyof PromptEditorToolbarActionsRef) => () => {
    if (!disabled && isEditMode) {
      const fn = actionsRef?.current?.[actionName];
      if (typeof fn === 'function') fn();
    }
  };

  return (
    <div
      // No bottom border on the toolbar itself — the separator is drawn by the absolute hairline
      // `<span>` below at full width so the L/R outlines stay continuous with the editor body's
      // `border-t-0` border underneath.
      className="relative flex items-center justify-between gap-1 overflow-hidden rounded-t-md border border-b-0 bg-background px-2 py-1"
      data-testid="editor-toolbar"
    >
      <span
        aria-hidden
        data-testid="editor-toolbar-separator"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-border/40"
      />
      {/* Left: Edit/Preview mode switcher */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center rounded-md bg-muted p-0.5">
          <button
            type="button"
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors',
              mode === 'edit' ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-accent'
            )}
            disabled={disabled}
            onClick={() => onModeChange('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors',
              mode === 'preview' ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-accent'
            )}
            disabled={disabled}
            onClick={() => onModeChange('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Right: formatting cluster (Bold/Italic/Strike) → list cluster (Numbered/Bullet) → Expand. */}
      <div className="flex items-center gap-0.5 overflow-hidden">
        <ToolbarButton
          icon={Bold}
          label="Bold"
          disabled={disabled || !isEditMode}
          onClick={handleFormat('formatBold')}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          disabled={disabled || !isEditMode}
          onClick={handleFormat('formatItalic')}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          disabled={disabled || !isEditMode}
          onClick={handleFormat('formatStrikethrough')}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          disabled={disabled || !isEditMode}
          onClick={handleFormat('formatNumberedList')}
        />
        <ToolbarButton
          icon={List}
          label="Bulleted List"
          disabled={disabled || !isEditMode}
          onClick={handleFormat('formatBulletedList')}
        />

        {onFullscreen && (
          <>
            <ToolbarSeparator />
            <ToolbarButton
              icon={Maximize2}
              label="Expand"
              disabled={disabled}
              onClick={onFullscreen}
            />
          </>
        )}
      </div>
    </div>
  );
};
