import { Bold, Italic, List, ListOrdered, Maximize2, Strikethrough } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { DEFAULT_PROMPT_EDITOR_STRINGS, type PromptEditorStrings } from '../prompt-editor-config';
import type {
  PromptEditorMode,
  PromptEditorToolbarActionsRef,
  PromptEditorToolbarActiveFormats,
} from '../types';

export interface EditorToolbarProps {
  mode: PromptEditorMode;
  onModeChange: (mode: PromptEditorMode) => void;
  disabled?: boolean;
  error?: boolean;
  actionsRef?: React.RefObject<PromptEditorToolbarActionsRef | null>;
  onFullscreen?: () => void;
  /**
   * Whether the Edit/Preview switcher renders. When hidden, the formatting cluster moves to the
   * left edge (there is no preview mode to guard, so buttons follow `disabled` alone) and
   * `trailing` right-aligns — the layout used by value-mode fields whose mode menu lives in
   * `trailing`. Defaults to true.
   */
  showModeToggle?: boolean;
  /** Consumer-supplied node rendered at the toolbar's right end (e.g. a value-mode menu). */
  trailing?: React.ReactNode;
  /** Overridable labels; every key defaults to the built-in English. */
  strings?: PromptEditorStrings;
  /** Rich mode: which formats the selection carries — drives `aria-pressed` on the buttons. */
  activeFormats?: PromptEditorToolbarActiveFormats;
}

/**
 * Toolbar formatting button: 28×28 px tap target, 4 px border-radius, 14 px lucide icon.
 */
const ToolbarButton = ({
  icon: Icon,
  label,
  disabled,
  onClick,
  pressed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  /** Toggled-on state (rich mode). Undefined = the button is a plain action, no aria-pressed. */
  pressed?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-muted-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:opacity-50 disabled:pointer-events-none',
          pressed && 'bg-accent text-accent-foreground'
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
  error,
  actionsRef,
  onFullscreen,
  showModeToggle = true,
  trailing,
  strings = DEFAULT_PROMPT_EDITOR_STRINGS,
  activeFormats,
}: EditorToolbarProps) => {
  // Without the Edit/Preview switcher there is no preview state to guard against.
  const isEditMode = !showModeToggle || mode === 'edit';

  const handleFormat = (actionName: keyof PromptEditorToolbarActionsRef) => () => {
    if (!disabled && isEditMode) {
      const fn = actionsRef?.current?.[actionName];
      if (typeof fn === 'function') fn();
    }
  };

  const formattingCluster = (
    <>
      <ToolbarButton
        icon={Bold}
        pressed={activeFormats?.bold}
        label={strings.bold}
        disabled={disabled || !isEditMode}
        onClick={handleFormat('formatBold')}
      />
      <ToolbarButton
        icon={Italic}
        pressed={activeFormats?.italic}
        label={strings.italic}
        disabled={disabled || !isEditMode}
        onClick={handleFormat('formatItalic')}
      />
      <ToolbarButton
        icon={Strikethrough}
        pressed={activeFormats?.strikethrough}
        label={strings.strikethrough}
        disabled={disabled || !isEditMode}
        onClick={handleFormat('formatStrikethrough')}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={ListOrdered}
        pressed={activeFormats?.orderedList}
        label={strings.numberedList}
        disabled={disabled || !isEditMode}
        onClick={handleFormat('formatNumberedList')}
      />
      <ToolbarButton
        icon={List}
        pressed={activeFormats?.bulletedList}
        label={strings.bulletedList}
        disabled={disabled || !isEditMode}
        onClick={handleFormat('formatBulletedList')}
      />

      {onFullscreen && (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            icon={Maximize2}
            label={strings.expand}
            disabled={disabled}
            onClick={onFullscreen}
          />
        </>
      )}
    </>
  );

  return (
    <div
      // No bottom border on the toolbar itself — the separator is drawn by the absolute hairline
      // `<span>` below at full width so the L/R outlines stay continuous with the editor body's
      // `border-t-0` border underneath.
      className={cn(
        'relative flex items-center justify-between gap-1 overflow-hidden rounded-t-md border border-b-0 bg-background px-2 py-1 future:rounded-t-xl future:border-0 future:bg-surface-overlay',
        error && 'border-error ring-1 ring-error/20 future:ring-error/40'
      )}
      data-testid="editor-toolbar"
    >
      <span
        aria-hidden
        data-testid="editor-toolbar-separator"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-border/40"
      />
      {showModeToggle ? (
        <>
          {/* Left: Edit/Preview mode switcher */}
          <div className="flex items-center gap-1 shrink-0">
            <fieldset
              aria-label={strings.editorModeLabel}
              className="m-0 flex items-center rounded-md border-0 bg-muted p-0.5"
            >
              <button
                type="button"
                aria-pressed={mode === 'edit'}
                className={cn(
                  'cursor-pointer rounded px-2 py-0.5 text-[11px] font-semibold transition-colors',
                  mode === 'edit' ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-accent'
                )}
                disabled={disabled}
                onClick={() => onModeChange('edit')}
              >
                {strings.edit}
              </button>
              <button
                type="button"
                aria-pressed={mode === 'preview'}
                className={cn(
                  'cursor-pointer rounded px-2 py-0.5 text-[11px] font-semibold transition-colors',
                  mode === 'preview'
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
                disabled={disabled}
                onClick={() => onModeChange('preview')}
              >
                {strings.preview}
              </button>
            </fieldset>
          </div>

          {/* Right: formatting cluster (Bold/Italic/Strike) → list cluster (Numbered/Bullet) → Expand → trailing. */}
          <div className="flex items-center gap-0.5 overflow-hidden">
            {formattingCluster}
            {trailing && (
              <>
                <ToolbarSeparator />
                {trailing}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* No mode switcher: formatting cluster left-aligns, trailing right-aligns. */}
          <div className="flex items-center gap-0.5 overflow-hidden">{formattingCluster}</div>
          {trailing && <div className="flex items-center gap-0.5 shrink-0">{trailing}</div>}
        </>
      )}
    </div>
  );
};
