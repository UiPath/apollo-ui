import { memo } from 'react';
import { Database, Paperclip, SquareFunction, Variable } from 'lucide-react';
import { getPromptEditorTokenColors } from '../types';
import type { PromptEditorDiffType, PromptEditorTokenType } from '../types';

/** Leading icon per token type — mirrors the SVG markup `MarkdownPreview` inlines for preview mode. */
const TOKEN_TYPE_ICON: Record<
  PromptEditorTokenType,
  React.ComponentType<{ className?: string }>
> = {
  input: Variable,
  output: SquareFunction,
  state: Database,
  resource: Paperclip,
  text: Variable,
};

export interface TokenPillProps {
  value: string;
  /** Token type — selects the leading icon and (via the wrapper) the tooltip label. */
  tokenType: PromptEditorTokenType;
  onRemove?: () => void;
  diffType?: PromptEditorDiffType;
  readonly?: boolean;
  isInvalid?: boolean;
  /** True when the underlying Lexical decorator is in `NodeSelection` — drives the focus outline. */
  isSelected?: boolean;
  /** Mouse-down on the pill body (not the X). The wrapper uses it to set NodeSelection on the decorator. */
  onMouseDown?: (e: React.MouseEvent) => void;
}

const TokenPillBase = ({
  value,
  tokenType,
  onRemove,
  diffType,
  readonly,
  isInvalid,
  isSelected,
  onMouseDown,
}: TokenPillProps) => {
  const PROMPT_EDITOR_TOKEN_COLORS = getPromptEditorTokenColors();
  const colors =
    isInvalid && !diffType ? PROMPT_EDITOR_TOKEN_COLORS.invalid : PROMPT_EDITOR_TOKEN_COLORS.valid;
  const Icon = TOKEN_TYPE_ICON[tokenType];

  const handleRemoveMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  const bgColor = diffType
    ? diffType === 'added'
      ? 'rgba(76, 175, 80, 0.15)'
      : 'rgba(244, 67, 54, 0.15)'
    : colors.background;

  const outerClassName = [
    'relative inline-flex items-center align-middle gap-[3px] h-5 rounded px-1 text-[13px] leading-5 outline-offset-1',
    readonly ? 'cursor-default' : 'cursor-pointer',
    diffType === 'removed' ? 'line-through opacity-60' : '',
    isSelected ? 'z-10' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the pill is a Lexical decorator chip; mousedown sets node selection. Keyboard selection is handled by Lexical at the editor root, and the chip exposes a focusable Remove button.
    <span
      onMouseDown={onMouseDown}
      className={outerClassName}
      style={{
        backgroundColor: bgColor,
        outline: isSelected ? `2px solid ${colors.border}` : 'none',
      }}
    >
      <span className="inline-flex shrink-0" style={{ color: colors.icon }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span
        className="font-normal whitespace-nowrap"
        style={{ color: colors.text, fontFamily: "'Noto Sans', sans-serif" }}
      >
        {value}
      </span>
      {!readonly && (
        <button
          type="button"
          aria-label="Remove token"
          className="inline-flex items-center justify-center p-px border-0 bg-transparent cursor-pointer rounded-[2px] w-4 h-4"
          style={{ color: colors.text }}
          onMouseDown={handleRemoveMouseDown}
          onClick={handleRemoveClick}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export const TokenPill = memo(TokenPillBase);
