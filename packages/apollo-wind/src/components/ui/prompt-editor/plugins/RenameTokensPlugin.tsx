import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import {
  isInputTokenNode,
  isOutputTokenNode,
  isResourceTokenNode,
  isStateTokenNode,
} from '../nodes';
import type {
  PromptEditorAutoCompleteOption,
  PromptEditorToken,
  PromptEditorTokenType,
} from '../types';
import { $getEditorTokensInternal } from '../utils';
import { getAllPromptTokenNodes } from './shared/token-nodes';

type NonTextTokenType = Exclude<PromptEditorTokenType, 'text'>;

interface RenameTokensPluginProps {
  options: PromptEditorAutoCompleteOption[];
  onChange?: (tokens: PromptEditorToken[]) => void;
}

const TOKEN_TYPES: NonTextTokenType[] = ['input', 'state', 'output', 'resource'];

interface PathTreeNode {
  children: Map<string, PathTreeNode>;
}
interface TokenPathRename {
  oldPath: string;
  newPath: string;
  type: NonTextTokenType;
}

const createTreeNode = (): PathTreeNode => ({ children: new Map() });

const buildPathTree = (paths: Iterable<string>): PathTreeNode => {
  const root = createTreeNode();
  for (const path of paths) {
    if (!path) continue;
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) continue;
    let current = root;
    for (const segment of segments) {
      const next = current.children.get(segment) ?? createTreeNode();
      if (!current.children.has(segment)) current.children.set(segment, next);
      current = next;
    }
  }
  return root;
};

const joinPath = (prefix: string, key: string): string => (prefix ? `${prefix}.${key}` : key);

const detectPathRenames = (
  prevNode: PathTreeNode,
  nextNode: PathTreeNode,
  prevPrefix: string,
  nextPrefix: string,
  renames: { oldPath: string; newPath: string }[]
) => {
  const prevKeys = [...prevNode.children.keys()];
  const nextKeys = [...nextNode.children.keys()];
  const removedKeys = prevKeys.filter((k) => !nextNode.children.has(k));
  const addedKeys = nextKeys.filter((k) => !prevNode.children.has(k));
  const commonKeys = prevKeys.filter((k) => nextNode.children.has(k));

  if (removedKeys.length === 1 && addedKeys.length === 1) {
    const oldPath = joinPath(prevPrefix, removedKeys[0]);
    const newPath = joinPath(nextPrefix, addedKeys[0]);
    renames.push({ oldPath, newPath });
    const prevChild = prevNode.children.get(removedKeys[0]);
    const nextChild = nextNode.children.get(addedKeys[0]);
    if (prevChild && nextChild) detectPathRenames(prevChild, nextChild, oldPath, newPath, renames);
  }

  for (const key of commonKeys) {
    const prevChild = prevNode.children.get(key);
    const nextChild = nextNode.children.get(key);
    if (prevChild && nextChild)
      detectPathRenames(
        prevChild,
        nextChild,
        joinPath(prevPrefix, key),
        joinPath(nextPrefix, key),
        renames
      );
  }
};

const groupOptionsByType = (options: PromptEditorAutoCompleteOption[]) => {
  const grouped: Record<NonTextTokenType, Set<string>> = {
    input: new Set(),
    state: new Set(),
    output: new Set(),
    resource: new Set(),
  };
  for (const opt of options) grouped[opt.type].add(opt.value);
  return grouped;
};

const detectRenamesByType = (
  prevOptions: PromptEditorAutoCompleteOption[],
  currOptions: PromptEditorAutoCompleteOption[]
): TokenPathRename[] => {
  const prevGrouped = groupOptionsByType(prevOptions);
  const currGrouped = groupOptionsByType(currOptions);
  const renames: TokenPathRename[] = [];
  for (const type of TOKEN_TYPES) {
    const typeRenames: { oldPath: string; newPath: string }[] = [];
    detectPathRenames(
      buildPathTree(prevGrouped[type]),
      buildPathTree(currGrouped[type]),
      '',
      '',
      typeRenames
    );
    for (const rename of typeRenames) renames.push({ ...rename, type });
  }
  return renames;
};

const applyPathRename = (value: string, oldPath: string, newPath: string): string => {
  if (value === oldPath) return newPath;
  if (value.startsWith(`${oldPath}.`)) return `${newPath}${value.slice(oldPath.length)}`;
  return value;
};

export const RenameTokensPlugin = ({ options, onChange }: RenameTokensPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const prevOptionsRef = useRef<PromptEditorAutoCompleteOption[]>(options);
  const renameSequenceRef = useRef(0);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const prevOptions = prevOptionsRef.current;
    prevOptionsRef.current = options;

    const renames = detectRenamesByType(prevOptions, options);
    if (renames.length === 0) return;

    const sortedRenames = [...renames].sort((a, b) => b.oldPath.length - a.oldPath.length);
    const renameSequence = ++renameSequenceRef.current;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || renameSequenceRef.current !== renameSequence) return;

      let updatedTokens: PromptEditorToken[] | null = null;
      editor.update(
        () => {
          let tokensChanged = false;
          const tokenNodes = getAllPromptTokenNodes();

          // Group renames by token type once so the per-node lookup is O(1) instead of
          // re-filtering all renames for every node (which made the update O(nodes × renames)).
          const renamesByType = new Map<string, typeof sortedRenames>();
          for (const rename of sortedRenames) {
            const list = renamesByType.get(rename.type);
            if (list) list.push(rename);
            else renamesByType.set(rename.type, [rename]);
          }

          for (const node of tokenNodes) {
            const nodeType = isInputTokenNode(node)
              ? 'input'
              : isOutputTokenNode(node)
                ? 'output'
                : isStateTokenNode(node)
                  ? 'state'
                  : isResourceTokenNode(node)
                    ? 'resource'
                    : null;
            if (!nodeType) continue;

            const matchingRenames = renamesByType.get(nodeType);
            if (!matchingRenames) continue;

            const currentValue = node.getValue();
            let nextValue = currentValue;
            for (const rename of matchingRenames)
              nextValue = applyPathRename(nextValue, rename.oldPath, rename.newPath);

            if (nextValue !== currentValue) {
              node.setValue(nextValue);
              tokensChanged = true;
            }
          }

          if (tokensChanged) updatedTokens = $getEditorTokensInternal();
        },
        {
          discrete: true,
          onUpdate: () => {
            if (cancelled || renameSequenceRef.current !== renameSequence) return;
            if (updatedTokens) onChangeRef.current?.(updatedTokens);
          },
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [editor, options]);

  return null;
};
