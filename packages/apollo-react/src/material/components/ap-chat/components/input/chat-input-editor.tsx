import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  AutopilotChatResourcePickerProvider,
  useAutopilotChatResourcePicker,
} from '../../providers/resource-picker-provider';
import type { AutopilotChatResourceItem } from '../../service';
import {
  ResourcePickerDropdown,
  type ResourcePickerDropdownHandle,
} from './chat-input-resource-picker';
import { TipTapEditor, type TipTapEditorHandle } from './tiptap';

export interface ChatInputEditorHandle {
  clear: () => void;
  focus: () => void;
  openResourcePicker: () => void;
  getSerializedContent: () => string;
}

export interface ChatInputEditorProps {
  value: string;
  placeholder: string;
  minRows: number;
  maxRows: number;
  lineHeight?: string;
  anchorEl: HTMLElement | null;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

interface EditorWithPickerProps extends ChatInputEditorProps {
  editorRef: React.RefObject<TipTapEditorHandle | null>;
}

const EditorWithPicker = forwardRef<ChatInputEditorHandle, EditorWithPickerProps>(
  function EditorWithPicker(props, ref) {
    const {
      value,
      placeholder,
      minRows,
      maxRows,
      lineHeight,
      onChange,
      onKeyDown,
      editorRef,
    } = props;
    const dropdownRef = useRef<ResourcePickerDropdownHandle>(null);
    const picker = useAutopilotChatResourcePicker();

    const handleChange = useCallback(
      (newValue: string) => {
        if (picker.isOpen && picker.drillDown && !newValue.includes('@')) {
          picker.close();
        }
        onChange(newValue);
      },
      [picker, onChange]
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent): boolean => {
        if (picker.isOpen && dropdownRef.current?.handleKeyDown(event)) {
          return true;
        }
        return onKeyDown?.(event) ?? false;
      },
      [picker.isOpen, onKeyDown]
    );

    const openResourcePicker = useCallback(() => {
      editorRef.current?.triggerMention();
    }, [editorRef]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editorRef.current?.focus(),
        getSerializedContent: () => editorRef.current?.getSerializedContent() ?? value,
        clear: () => editorRef.current?.clear(),
        openResourcePicker,
      }),
      [editorRef, value, openResourcePicker]
    );

    return (
      <>
        <TipTapEditor
          ref={editorRef}
          value={value}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          lineHeight={lineHeight}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onMentionStart={picker.open}
          onMentionEnd={picker.close}
          onMentionQueryChange={picker.setQuery}
        />
        <ResourcePickerDropdown ref={dropdownRef} />
      </>
    );
  }
);

/**
 * Chat input editor with resource picker support.
 * The outer component provides the picker context and holds the editor ref.
 * The inner component accesses the context and exposes methods via ref.
 */
export const ChatInputEditor = React.memo(
  forwardRef<ChatInputEditorHandle, ChatInputEditorProps>(function ChatInputEditor(props, ref) {
    const editorRef = useRef<TipTapEditorHandle>(null);

    const handleResourceSelect = useCallback(
      (resource: AutopilotChatResourceItem, range?: { from: number; to: number }) => {
        editorRef.current?.insertResource(resource, range);
        editorRef.current?.focus();
      },
      []
    );

    const handleDrillDown = useCallback(() => {
      editorRef.current?.clearMentionQuery();
    }, []);

    return (
      <AutopilotChatResourcePickerProvider
        onResourceSelect={handleResourceSelect}
        onDrillDown={handleDrillDown}
      >
        <EditorWithPicker {...props} ref={ref} editorRef={editorRef} />
      </AutopilotChatResourcePickerProvider>
    );
  })
);

ChatInputEditor.displayName = 'ChatInputEditor';
