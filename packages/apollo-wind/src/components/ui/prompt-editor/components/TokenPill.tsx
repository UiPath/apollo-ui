import { Database, Paperclip, SquareFunction, Variable } from 'lucide-react';
import { memo } from 'react';
import { ReferenceChip } from '../../reference-chip';
import { usePromptEditorConfig } from '../prompt-editor-config';
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
  const { strings } = usePromptEditorConfig();
  const Icon = TOKEN_TYPE_ICON[tokenType];
  return (
    <ReferenceChip
      label={value}
      icon={<Icon />}
      onRemove={onRemove}
      removeLabel={strings.removeToken}
      readOnly={readonly}
      invalid={isInvalid && !diffType}
      selected={isSelected}
      onMouseDown={onMouseDown}
      className={`${readonly ? 'cursor-default' : 'cursor-pointer'} ${diffType === 'removed' ? 'line-through opacity-60' : ''}`}
      style={
        diffType
          ? {
              backgroundColor:
                diffType === 'added' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
            }
          : undefined
      }
    />
  );
};

export const TokenPill = memo(TokenPillBase);
