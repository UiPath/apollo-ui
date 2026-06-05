import { useCallback, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { $createNodeSelection, $setSelection, type NodeKey } from 'lexical';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TokenPill, type TokenPillProps } from './TokenPill';
import { getPromptEditorTokenTypeLabel } from '../types';

export interface TokenPillWithTooltipProps extends TokenPillProps {
  /** Lexical node key for the underlying decorator — drives `NodeSelection` click-to-focus. */
  nodeKey: NodeKey;
}

/**
 * Wraps `TokenPill` with a hover tooltip showing the token's path and type label. Invalid chips
 * (not present in the editor's autocomplete options) surface a "not found" message paired with the
 * red-invalid pill styling. Suppressed when the chip is in a diff state so it doesn't clash with the
 * diff styling.
 */
export const TokenPillWithTooltip = ({ nodeKey, ...props }: TokenPillWithTooltipProps) => {
  // Pull primitives off props so the memo deps below stay stable (a fresh `props` bag is created on
  // every parent render even when its contents are unchanged).
  const { value: pillValue, tokenType, readonly, diffType, isInvalid, onRemove } = props;
  const typeLabel = getPromptEditorTokenTypeLabel(tokenType);

  const [editor] = useLexicalComposerContext();
  // Only `isSelected` from the hook — its `setSelected(true)` *adds* to the current NodeSelection,
  // which would let multiple pills be focused at once. We replace it with a fresh single-key
  // NodeSelection on mousedown.
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (readonly) return;
      // Stops the browser from creating a RangeSelection inside the decorator DOM.
      e.preventDefault();
      e.stopPropagation();
      editor.update(() => {
        const sel = $createNodeSelection();
        sel.add(nodeKey);
        $setSelection(sel);
      });
      // Lexical 0.42 editor.focus() no-ops for NodeSelection; focus the root so arrows reach Lexical.
      const rootElement = editor.getRootElement();
      if (rootElement) {
        rootElement.focus({ preventScroll: true });
        // Clear the browser's auto-placed caret so the pill outline is the only focus cue.
        globalThis.getSelection()?.removeAllRanges();
      }
    },
    [editor, nodeKey, readonly]
  );

  const pillProps = useMemo<TokenPillProps>(
    () => ({
      value: pillValue,
      tokenType,
      readonly,
      diffType,
      isInvalid,
      onRemove,
      isSelected,
      onMouseDown: handleMouseDown,
    }),
    [pillValue, tokenType, readonly, diffType, isInvalid, onRemove, isSelected, handleMouseDown]
  );

  if (diffType) return <TokenPill {...pillProps} />;

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <TokenPill {...pillProps} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {isInvalid ? (
          <div className="flex w-[280px] flex-col gap-1 text-xs">
            <div className="font-medium">Variable not found</div>
            <div className="break-words opacity-80">
              {pillValue} isn&apos;t available in this scope. Fix or remove this reference before
              publishing.
            </div>
          </div>
        ) : (
          <div className="flex max-w-[320px] flex-col gap-0.5 text-xs">
            <span className="font-mono opacity-95">{pillValue}</span>
            <span className="opacity-70">{typeLabel}</span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
