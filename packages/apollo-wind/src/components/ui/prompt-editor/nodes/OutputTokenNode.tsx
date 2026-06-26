import type { ReactNode } from 'react';
import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { TokenPillWithTooltip } from '../components/TokenPillWithTooltip';
import type { PromptEditorDiffType } from '../types';

export type SerializedOutputTokenNode = Spread<{ value: string }, SerializedLexicalNode>;

export class OutputTokenNode extends DecoratorNode<ReactNode> {
  __value: string;
  __diffType?: PromptEditorDiffType;
  __isInvalid?: boolean;

  static getType(): string {
    return 'output-token';
  }

  static clone(node: OutputTokenNode): OutputTokenNode {
    const cloned = new OutputTokenNode(node.__value, node.__key, node.__diffType);
    cloned.__isInvalid = node.__isInvalid;
    return cloned;
  }

  constructor(value: string, key?: NodeKey, diffType?: PromptEditorDiffType) {
    super(key);
    this.__value = value;
    this.__diffType = diffType;
  }

  getValue(): string {
    return this.__value;
  }

  setValue(value: string): this {
    const self = this.getWritable();
    self.__value = value;
    return self;
  }

  getIsInvalid(): boolean {
    return this.__isInvalid ?? false;
  }

  setIsInvalid(isInvalid: boolean): this {
    const self = this.getWritable();
    self.__isInvalid = isInvalid;
    return self;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.dataset.lexicalOutputToken = 'true';
    element.dataset.value = this.__value;
    element.textContent = this.__value;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!('lexicalOutputToken' in domNode.dataset)) return null;
        return {
          conversion: (element: HTMLElement) => ({
            node: new OutputTokenNode(element.dataset.value ?? ''),
          }),
          priority: 1,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedOutputTokenNode): OutputTokenNode {
    return new OutputTokenNode(serializedNode.value);
  }

  exportJSON(): SerializedOutputTokenNode {
    return { type: 'output-token', value: this.__value, version: 1 };
  }

  getTextContent(): string {
    return this.__value;
  }
  isInline(): boolean {
    return true;
  }
  isKeyboardSelectable(): boolean {
    return true;
  }

  decorate(editor: LexicalEditor): ReactNode {
    const readonly = !editor.isEditable();
    return (
      <TokenPillWithTooltip
        value={this.__value}
        tokenType="output"
        nodeKey={this.getKey()}
        diffType={this.__diffType}
        readonly={readonly}
        isInvalid={this.__isInvalid}
        onRemove={() => {
          if (!readonly)
            editor.update(() => {
              this.remove();
            });
        }}
      />
    );
  }
}

export const createOutputTokenNode = (
  value: string,
  diffType?: PromptEditorDiffType
): OutputTokenNode => $applyNodeReplacement(new OutputTokenNode(value, undefined, diffType));

export const isOutputTokenNode = (node: LexicalNode | null | undefined): node is OutputTokenNode =>
  node instanceof OutputTokenNode;
