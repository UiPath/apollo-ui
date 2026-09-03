import type { PromptEditorTokenPillSlotProps } from '../prompt-editor-config';
import { usePromptEditorConfig } from '../prompt-editor-config';
import { TokenPillWithTooltip } from './TokenPillWithTooltip';

/**
 * Indirection between a token decorator node and its rendered pill. Renders the built-in
 * `TokenPillWithTooltip` unless the host supplied `renderTokenPill` on the editor, in which case
 * that renderer decides (and receives the built-in pill as `defaultPill` so it can decorate it).
 */
export const TokenPillSlot = (props: Omit<PromptEditorTokenPillSlotProps, 'defaultPill'>) => {
  const { renderTokenPill } = usePromptEditorConfig();
  const { value, tokenType, nodeKey, diffType, readonly, isInvalid, onRemove } = props;

  const defaultPill = (
    <TokenPillWithTooltip
      value={value}
      tokenType={tokenType}
      nodeKey={nodeKey}
      diffType={diffType}
      readonly={readonly}
      isInvalid={isInvalid}
      onRemove={onRemove}
    />
  );

  if (!renderTokenPill) return defaultPill;
  return <>{renderTokenPill({ ...props, defaultPill })}</>;
};
