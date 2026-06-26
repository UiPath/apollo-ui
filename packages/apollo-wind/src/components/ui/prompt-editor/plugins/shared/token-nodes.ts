import type { LexicalNode } from 'lexical';
import { $dfs } from '@lexical/utils';
import { type InputTokenNode, isInputTokenNode } from '../../nodes/InputTokenNode';
import { type OutputTokenNode, isOutputTokenNode } from '../../nodes/OutputTokenNode';
import { type StateTokenNode, isStateTokenNode } from '../../nodes/StateTokenNode';
import { type ResourceTokenNode, isResourceTokenNode } from '../../nodes/ResourceTokenNode';

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
