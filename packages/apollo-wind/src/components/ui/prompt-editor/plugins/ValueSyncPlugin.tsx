import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $addUpdateTag, type LexicalEditor, SKIP_DOM_SELECTION_TAG } from 'lexical';
import type { PromptEditorToken } from '../types';
import { areTokensEqual, $getEditorTokensInternal, $setEditorTokensInternal } from '../utils';

const getDeepActiveElement = (rootElement: HTMLElement): Element | null => {
  const rootNode = rootElement.getRootNode();
  let activeElement: Element | null = null;
  if (rootNode instanceof ShadowRoot || rootNode instanceof Document) {
    activeElement = rootNode.activeElement;
  } else {
    activeElement = document.activeElement;
  }
  while (activeElement instanceof HTMLElement && activeElement.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }
  return activeElement;
};

const isEditorFocused = (rootElement: HTMLElement | null): boolean => {
  if (!rootElement) return false;
  const activeElement = getDeepActiveElement(rootElement);
  return !!activeElement && (activeElement === rootElement || rootElement.contains(activeElement));
};

export const ValueSyncPlugin = ({
  value,
  editorRef,
  lastEmittedValueRef,
  isSyncingRef,
}: {
  value: PromptEditorToken[] | undefined;
  editorRef: React.MutableRefObject<LexicalEditor | null>;
  lastEmittedValueRef?: React.MutableRefObject<PromptEditorToken[] | null>;
  isSyncingRef?: React.MutableRefObject<boolean>;
}) => {
  const [editor] = useLexicalComposerContext();
  const lastValueRef = useRef<PromptEditorToken[] | undefined>(value);

  useEffect(() => {
    // Only skip when uncontrolled (undefined). An empty array is a valid controlled value and must
    // sync so a controlled editor can be cleared by passing `[]`.
    if (value === undefined) return;
    if (value === lastValueRef.current) return;

    if (lastValueRef.current && areTokensEqual(lastValueRef.current, value)) {
      lastValueRef.current = value;
      return;
    }

    if (lastEmittedValueRef?.current && areTokensEqual(lastEmittedValueRef.current, value)) {
      lastValueRef.current = value;
      return;
    }

    const currentTokens = editorRef.current?.getEditorState().read($getEditorTokensInternal);
    if (currentTokens && areTokensEqual(currentTokens, value)) {
      lastValueRef.current = value;
      return;
    }

    const rootElement = editor.getRootElement();
    const editorIsFocused = isEditorFocused(rootElement);
    const shouldSkipDomSelection = !editorIsFocused;

    try {
      if (isSyncingRef) isSyncingRef.current = true;

      editor.update(
        () => {
          if (shouldSkipDomSelection) $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          $setEditorTokensInternal(value);
        },
        {
          discrete: true,
          onUpdate: () => {
            if (isSyncingRef) isSyncingRef.current = false;
          },
        }
      );

      lastValueRef.current = value;
    } catch (error) {
      if (isSyncingRef) isSyncingRef.current = false;
      console.error('ValueSyncPlugin: Error syncing value to editor', error);
    }
  }, [editor, value, editorRef, lastEmittedValueRef, isSyncingRef]);

  return null;
};
