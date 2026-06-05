import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { PromptEditorAutoCompleteOption } from '../types';
import { getAllPromptTokenNodes, type PromptTokenNode } from './shared/token-nodes';

export const ValidateTokensPlugin = ({
  options,
}: {
  options: PromptEditorAutoCompleteOption[];
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const validValues = new Map<string, Set<string>>();
    for (const opt of options) {
      if (!validValues.has(opt.type)) validValues.set(opt.type, new Set());
      validValues.get(opt.type)!.add(opt.value);
    }

    const checkIsInvalid = (node: PromptTokenNode) => {
      const nodeTypeToTokenType: Record<string, string> = {
        'input-token': 'input',
        'output-token': 'output',
        'state-token': 'state',
        'resource-token': 'resource',
      };
      const tokenType = nodeTypeToTokenType[node.getType()];
      if (!tokenType) return false;
      const validSet = validValues.get(tokenType);
      return !validSet || !validSet.has(node.getValue());
    };

    const validateAllNodes = () => {
      const tokenNodes = getAllPromptTokenNodes();
      for (const node of tokenNodes) {
        const isInvalid = checkIsInvalid(node);
        if (node.getIsInvalid() !== isInvalid) node.setIsInvalid(isInvalid);
      }
    };

    editor.update(validateAllNodes);

    const unregister = editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      if (editorState === prevEditorState) return;
      editorState.read(() => {
        const tokenNodes = getAllPromptTokenNodes();
        let needsUpdate = false;
        for (const node of tokenNodes) {
          if (node.getIsInvalid() !== checkIsInvalid(node)) {
            needsUpdate = true;
            break;
          }
        }
        if (needsUpdate) editor.update(validateAllNodes);
      });
    });

    return unregister;
  }, [editor, options]);

  return null;
};
