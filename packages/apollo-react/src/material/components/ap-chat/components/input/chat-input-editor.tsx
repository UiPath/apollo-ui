import React, { forwardRef, useRef } from 'react';
import { TipTapEditor, TipTapEditorHandle } from './tiptap';

export interface ChatInputEditorHandle {
  focus: () => void;
  getSerializedContent: () => string;
  clear: () => void;
}

export interface ChatInputEditorProps {
  value: string;
  placeholder: string;
  minRows: number;
  maxRows: number;
  lineHeight?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

function ChatInputEditorInner(
  props: ChatInputEditorProps,
  ref: React.ForwardedRef<ChatInputEditorHandle>
) {
  const { value, placeholder, minRows, maxRows, lineHeight, onChange, onKeyDown, onFocus, onBlur } =
    props;

  const editorRef = useRef<TipTapEditorHandle>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    getSerializedContent: () => editorRef.current?.getSerializedContent() ?? '',
    clear: () => editorRef.current?.clear(),
  }));

  return (
    <TipTapEditor
      ref={editorRef}
      value={value}
      placeholder={placeholder}
      minRows={minRows}
      maxRows={maxRows}
      lineHeight={lineHeight}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export const ChatInputEditor = React.memo(forwardRef(ChatInputEditorInner));
ChatInputEditor.displayName = 'ChatInputEditor';
