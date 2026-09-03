import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import type { PromptEditorAutoCompleteOption } from '../types';
import { normalizeVariablePath } from '../utils/autocomplete-segments';
import { getAllPromptTokenNodes, type PromptTokenNode } from './shared/token-nodes';

/** Lexical node type → token type. Constant, so defined once at module scope (not per node/pass). */
const NODE_TYPE_TO_TOKEN_TYPE: Record<string, string> = {
  'input-token': 'input',
  'output-token': 'output',
  'state-token': 'state',
  'resource-token': 'resource',
};

export const ValidateTokensPlugin = ({
  options,
}: {
  options: PromptEditorAutoCompleteOption[];
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Index-normalized on both sides (`records[0].id` → `records[].id`) so an option advertised
    // with the schema's example index also validates user-entered indices such as `records[1].id`.
    const validValues = new Map<string, Set<string>>();
    for (const opt of options) {
      if (!validValues.has(opt.type)) validValues.set(opt.type, new Set());
      validValues.get(opt.type)!.add(normalizeVariablePath(opt.value));
    }

    const checkIsInvalid = (node: PromptTokenNode) => {
      const tokenType = NODE_TYPE_TO_TOKEN_TYPE[node.getType()];
      if (!tokenType) return false;
      const validSet = validValues.get(tokenType);
      return !validSet || !validSet.has(normalizeVariablePath(node.getValue()));
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
