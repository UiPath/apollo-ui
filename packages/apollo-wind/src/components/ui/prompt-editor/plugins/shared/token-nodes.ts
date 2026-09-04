import { $dfs } from '@lexical/utils';
import type { LexicalNode } from 'lexical';
import { type InputTokenNode, isInputTokenNode } from '../../nodes/InputTokenNode';
import { isOutputTokenNode, type OutputTokenNode } from '../../nodes/OutputTokenNode';
import { isResourceTokenNode, type ResourceTokenNode } from '../../nodes/ResourceTokenNode';
import { isStateTokenNode, type StateTokenNode } from '../../nodes/StateTokenNode';

export type PromptTokenNode = InputTokenNode | OutputTokenNode | StateTokenNode | ResourceTokenNode;

export const isPromptTokenNode = (node: LexicalNode | null | undefined): node is PromptTokenNode =>
  isInputTokenNode(node) ||
  isOutputTokenNode(node) ||
  isStateTokenNode(node) ||
  isResourceTokenNode(node);

export const getAllPromptTokenNodes = (): PromptTokenNode[] => {
  const nodes: PromptTokenNode[] = [];

  for (const { node } of $dfs()) {
    if (isPromptTokenNode(node)) {
      nodes.push(node);
    }
  }

  return nodes;
};
