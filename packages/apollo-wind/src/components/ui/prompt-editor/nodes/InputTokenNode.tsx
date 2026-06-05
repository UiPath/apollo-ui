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

export type SerializedInputTokenNode = Spread<{ value: string }, SerializedLexicalNode>;

export class InputTokenNode extends DecoratorNode<ReactNode> {
  __value: string;
  __diffType?: PromptEditorDiffType;
  __isInvalid?: boolean;

  static getType(): string {
    return 'input-token';
  }

  static clone(node: InputTokenNode): InputTokenNode {
    const cloned = new InputTokenNode(node.__value, node.__key, node.__diffType);
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
    element.dataset.lexicalInputToken = 'true';
    element.dataset.value = this.__value;
    element.textContent = this.__value;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!('lexicalInputToken' in domNode.dataset)) return null;
        return {
          conversion: (element: HTMLElement) => ({
            node: new InputTokenNode(element.dataset.value ?? ''),
          }),
          priority: 1,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedInputTokenNode): InputTokenNode {
    return new InputTokenNode(serializedNode.value);
  }

  exportJSON(): SerializedInputTokenNode {
    return { type: 'input-token', value: this.__value, version: 1 };
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
        tokenType="input"
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

export const createInputTokenNode = (
  value: string,
  diffType?: PromptEditorDiffType
): InputTokenNode => $applyNodeReplacement(new InputTokenNode(value, undefined, diffType));

export const isInputTokenNode = (node: LexicalNode | null | undefined): node is InputTokenNode =>
  node instanceof InputTokenNode;
