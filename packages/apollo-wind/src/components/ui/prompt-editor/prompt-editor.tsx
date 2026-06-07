import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import { InputTokenNode, OutputTokenNode, StateTokenNode, ResourceTokenNode } from './nodes';
import { CopyPastePlugin } from './plugins/CopyPastePlugin';
import { EditorRefPlugin } from './plugins/EditorRefPlugin';
import { MultilinePlugin } from './plugins/MultilinePlugin';
import { NodeSelectionFixPlugin } from './plugins/NodeSelectionFixPlugin';
import { ValueSyncPlugin } from './plugins/ValueSyncPlugin';
import { AutocompletePlugin } from './plugins/AutocompletePlugin';
import { ValidateTokensPlugin } from './plugins/ValidateTokensPlugin';
import { RenameTokensPlugin } from './plugins/RenameTokensPlugin';
import { ToolbarActionsPlugin } from './plugins/ToolbarActionsPlugin';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EditorToolbar } from './components/EditorToolbar';
import { MarkdownPreview } from './components/MarkdownPreview';
import type {
  PromptEditorAutoCompleteOption,
  PromptEditorMode,
  PromptEditorToken,
  PromptEditorToolbarActionsRef,
} from './types';
import {
  areTokensEqual,
  $getEditorTokensInternal,
  $setEditorTokensInternal,
  $insertTokenAtCursor,
} from './utils';

const DEFAULT_MIN_ROWS = 4;
const DEFAULT_MAX_ROWS = 20;
const LINE_HEIGHT = 20;

export interface PromptEditorRef {
  setTokens: (tokens: PromptEditorToken[]) => void;
  /** Focus the editor and insert the `$` trigger character to open the autocomplete menu. */
  insertAutocompleteTrigger: () => void;
  /** Focus the editor and insert a variable token pill at the current cursor position. */
  insertVariableToken: (option: PromptEditorAutoCompleteOption) => void;
}

export interface PromptEditorProps {
  value?: PromptEditorToken[];
  initialValue?: PromptEditorToken[];
  onChange?: (value: PromptEditorToken[]) => void;
  autoCompleteOptions?: PromptEditorAutoCompleteOption[];
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  showToolbar?: boolean;
  mode?: PromptEditorMode;
  onModeChange?: (mode: PromptEditorMode) => void;
  onFullscreen?: () => void;
  editorRef?: React.RefObject<PromptEditorRef | null>;
  fillHeight?: boolean;
  /** Drop the editor's own border/background/rounding so a parent can provide the field chrome. */
  borderless?: boolean;
}

const EMPTY_AUTOCOMPLETE_OPTIONS: PromptEditorAutoCompleteOption[] = [];
const EMPTY_TOKENS: PromptEditorToken[] = [];

/** Normalize a token-array prop so malformed input (e.g. an object injected by a Storybook control) can't crash the editor. */
const toTokenArray = (v: PromptEditorToken[] | undefined): PromptEditorToken[] | undefined =>
  v === undefined ? undefined : Array.isArray(v) ? v : EMPTY_TOKENS;

interface EditorInnerProps
  extends Omit<
    PromptEditorProps,
    'editorRef' | 'showToolbar' | 'mode' | 'onModeChange' | 'onFullscreen'
  > {
  toolbarActionsRef: React.MutableRefObject<PromptEditorToolbarActionsRef | null>;
  showToolbar?: boolean;
}

const EditorInner = forwardRef(
  (
    {
      initialValue,
      value,
      onChange,
      autoCompleteOptions = EMPTY_AUTOCOMPLETE_OPTIONS,
      multiline = true,
      minRows = DEFAULT_MIN_ROWS,
      maxRows = DEFAULT_MAX_ROWS,
      placeholder,
      disabled,
      ariaLabel,
      fillHeight,
      borderless,
      toolbarActionsRef,
      showToolbar,
    }: EditorInnerProps,
    ref: React.ForwardedRef<PromptEditorRef>
  ) => {
    const editorRef = useRef<LexicalEditor | null>(null);
    const [isEmpty, setIsEmpty] = useState(() => {
      const seed = initialValue ?? value;
      return !seed || seed.length === 0;
    });
    const initializedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const isEmptyRef = useRef(isEmpty);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingTokensRef = useRef<PromptEditorToken[] | null>(null);
    const lastEmittedValueRef = useRef<PromptEditorToken[] | null>(null);
    const isMountedRef = useRef(true);
    const isSyncingRef = useRef(false);

    onChangeRef.current = onChange;
    isEmptyRef.current = isEmpty;

    useImperativeHandle(
      ref,
      () => ({
        setTokens: (tokens: PromptEditorToken[]) => {
          if (editorRef.current) {
            editorRef.current.update(() => {
              $setEditorTokensInternal(tokens);
            });
          }
          onChangeRef.current?.(tokens);
        },
        insertAutocompleteTrigger: () => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.focus();
          // Use Lexical's own update mechanism to insert '$' at the cursor,
          // which triggers the AutocompletePlugin's findTrigger detection.
          editor.update(() => {
            const selection = $getSelection();
            // insertRawText only exists on a RangeSelection; guard so a NodeSelection
            // (a focused token pill) can't make this helper throw.
            if ($isRangeSelection(selection)) {
              selection.insertRawText('$');
            }
          });
        },
        insertVariableToken: (option: PromptEditorAutoCompleteOption) => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.focus();
          editor.update(() => {
            $insertTokenAtCursor(option);
          });
        },
      }),
      []
    );

    const contentEditableStyle = useMemo(() => {
      const verticalPadding = 8;
      // Borderless means the parent supplies the field chrome, so inherit its text color instead of
      // forcing the theme foreground — otherwise the editor can render e.g. white text on a parent's
      // light surface. The bordered variant pairs the foreground with its own `bg-background`.
      const textColor = borderless ? 'inherit' : 'var(--color-foreground)';
      const base = {
        width: '100%',
        outline: 'none',
        userSelect: 'text' as const,
        boxSizing: 'border-box' as const,
        padding: '8px 12px',
        fontFamily: "'Noto Sans', sans-serif",
        fontSize: '14px',
        lineHeight: `${LINE_HEIGHT}px`,
        color: textColor,
      };

      if (!multiline) {
        return {
          ...base,
          height: '36px',
          maxHeight: '36px',
          overflowX: 'auto' as const,
          overflowY: 'hidden' as const,
          whiteSpace: 'nowrap' as const,
        };
      }

      // Clamp the floor to the cap: CSS `min-height` wins over `max-height`, so if `maxRows` is set
      // below `minRows` the cap would otherwise be silently ignored. `maxRows` is the authoritative
      // upper bound, so the effective minimum can't exceed it.
      const effectiveMinRows = Math.min(minRows, maxRows);
      const minHeight = effectiveMinRows * LINE_HEIGHT + verticalPadding * 2;
      const maxHeight = maxRows * LINE_HEIGHT + verticalPadding * 2;

      return {
        ...base,
        minHeight: `${minHeight}px`,
        ...(fillHeight ? { flex: 1 } : { maxHeight: `${maxHeight}px` }),
        overflowY: 'auto' as const,
      };
    }, [multiline, minRows, maxRows, fillHeight, borderless]);

    const handleEditorRef = useCallback((editor: LexicalEditor) => {
      editorRef.current = editor;
    }, []);

    const handleChange = useCallback(() => {
      if (!editorRef.current) return;

      editorRef.current.getEditorState().read(() => {
        const tokens = $getEditorTokensInternal();
        const newIsEmpty =
          tokens.length === 0 ||
          (tokens.length === 1 && tokens[0].type === 'text' && tokens[0].value === '');
        if (newIsEmpty !== isEmptyRef.current) setIsEmpty(newIsEmpty);
        if (!isSyncingRef.current) pendingTokensRef.current = tokens;
      });

      if (isSyncingRef.current || !onChangeRef.current) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (
          !isMountedRef.current ||
          !pendingTokensRef.current ||
          !onChangeRef.current ||
          !editorRef.current ||
          isSyncingRef.current
        )
          return;
        lastEmittedValueRef.current = pendingTokensRef.current;
        onChangeRef.current(pendingTokensRef.current);
        pendingTokensRef.current = null;
      }, 0);
    }, []);

    useEffect(() => {
      if (
        value &&
        lastEmittedValueRef.current &&
        !areTokensEqual(value, lastEmittedValueRef.current)
      ) {
        lastEmittedValueRef.current = null;
      }
    }, [value]);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        pendingTokensRef.current = null;
      };
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: seeds the editor exactly once on mount — from initialValue, or from the controlled `value` when no initialValue is given so controlled-only usage renders. Later updates flow through `value` + ValueSyncPlugin.
    useEffect(() => {
      const seed = initialValue ?? value;
      if (!editorRef.current || !seed || initializedRef.current) return;
      const valueToSet = seed;
      queueMicrotask(() => {
        if (!editorRef.current || initializedRef.current) return;
        editorRef.current.update(() => {
          $setEditorTokensInternal(valueToSet);
          setIsEmpty(valueToSet.length === 0);
          initializedRef.current = true;
        });
      });
    }, []);

    useEffect(() => {
      if (!editorRef.current) return;
      editorRef.current.setEditable(!disabled);
    }, [disabled]);

    // Defensive: tolerate a non-array `autoCompleteOptions` (e.g. an empty object injected by
    // Storybook's "Set object" control) so the token plugins never iterate a non-iterable and crash.
    const options = Array.isArray(autoCompleteOptions)
      ? autoCompleteOptions
      : EMPTY_AUTOCOMPLETE_OPTIONS;

    const wrapperClassName = borderless
      ? 'flex flex-col w-full relative'
      : `prompt-editor-shell flex flex-col w-full relative border bg-background ${showToolbar ? 'border-t-0 rounded-b-md' : 'rounded-md'}`;

    return (
      <div
        className={wrapperClassName}
        style={{
          fontFamily: "'Noto Sans', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
        }}
      >
        <style>{`
          .prompt-editor-paragraph { padding: 0; margin: 0; }
          ${borderless ? '' : '.prompt-editor-shell:focus-within { border-color: var(--color-ring); box-shadow: 0 0 0 1px var(--color-ring); }'}
          .prompt-editor-root *::selection { background-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }
        `}</style>
        <div
          className="prompt-editor-root"
          style={{
            position: 'relative',
            ...(fillHeight
              ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }
              : {}),
          }}
        >
          <PlainTextPlugin
            contentEditable={<ContentEditable style={contentEditableStyle} ariaLabel={ariaLabel} />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {placeholder && isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '12px',
                right: '12px',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: "'Noto Sans', sans-serif",
                fontSize: '14px',
                lineHeight: '20px',
                ...(multiline
                  ? {}
                  : {
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis' as const,
                    }),
              }}
              className="text-muted-foreground/60"
            >
              {placeholder}
            </div>
          )}
        </div>
        <HistoryPlugin />
        <NodeSelectionFixPlugin />
        <CopyPastePlugin />
        <EditorRefPlugin onRef={handleEditorRef} />
        <ValueSyncPlugin
          value={value}
          editorRef={editorRef}
          lastEmittedValueRef={lastEmittedValueRef}
          isSyncingRef={isSyncingRef}
        />
        <MultilinePlugin multiline={multiline} />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <ToolbarActionsPlugin actionsRef={toolbarActionsRef} />
        {options.length > 0 && <AutocompletePlugin options={options} />}
        <ValidateTokensPlugin options={options} />
        {options.length > 0 && <RenameTokensPlugin options={options} onChange={onChange} />}
      </div>
    );
  }
);

EditorInner.displayName = 'PromptEditorInner';

export const PromptEditor = ({
  value: rawValue,
  initialValue: rawInitialValue,
  onChange,
  multiline = true,
  minRows = DEFAULT_MIN_ROWS,
  maxRows = DEFAULT_MAX_ROWS,
  placeholder,
  disabled,
  ariaLabel,
  autoCompleteOptions,
  showToolbar = false,
  mode: controlledMode,
  onModeChange,
  onFullscreen,
  editorRef,
  fillHeight,
  borderless,
}: PromptEditorProps) => {
  // Normalize the token-array props once so malformed input (e.g. `{}` from a Storybook object
  // control) can't crash the editor, the preview, or ValueSyncPlugin.
  const value = toTokenArray(rawValue);
  const initialValue = toTokenArray(rawInitialValue);

  const [internalMode, setInternalMode] = useState<PromptEditorMode>('edit');
  const mode = controlledMode ?? internalMode;
  const toolbarActionsRef = useRef<PromptEditorToolbarActionsRef | null>(null);
  const [uncontrolledPreviewTokens, setUncontrolledPreviewTokens] = useState<PromptEditorToken[]>(
    initialValue ?? []
  );

  const handleModeChange = useCallback(
    (newMode: PromptEditorMode) => {
      if (onModeChange) onModeChange(newMode);
      else setInternalMode(newMode);
    },
    [onModeChange]
  );

  const initialConfig = useMemo(
    () => ({
      namespace: 'PromptEditor',
      theme: { paragraph: 'prompt-editor-paragraph' },
      onError: (error: Error) => console.error('PromptEditor error:', error),
      nodes: [InputTokenNode, OutputTokenNode, StateTokenNode, ResourceTokenNode],
    }),
    []
  );

  const isControlled = value !== undefined;
  const previewTokens = isControlled ? value : uncontrolledPreviewTokens;

  const handleEditorChange = useCallback(
    (tokens: PromptEditorToken[]) => {
      if (!isControlled) setUncontrolledPreviewTokens(tokens);
      onChange?.(tokens);
    },
    [isControlled, onChange]
  );

  return (
    <TooltipProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
        }}
      >
        {showToolbar && (
          <EditorToolbar
            mode={mode}
            disabled={disabled}
            actionsRef={toolbarActionsRef}
            onModeChange={handleModeChange}
            onFullscreen={onFullscreen}
          />
        )}

        {/* Preview mode — mirror `borderless`: when set, the parent supplies the chrome, so drop
            the editor's own border/background here too (keeps edit/preview consistent). */}
        {mode === 'preview' && (
          <div
            className={
              borderless
                ? undefined
                : `border bg-background ${showToolbar ? 'border-t-0 rounded-b-md' : 'rounded-md'}`
            }
          >
            <MarkdownPreview tokens={previewTokens} minRows={minRows} />
          </div>
        )}

        {/* Editor — keep mounted but hide in preview mode */}
        <div
          style={{
            display: mode === 'preview' ? 'none' : 'flex',
            flexDirection: 'column',
            ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
          }}
        >
          <LexicalComposer initialConfig={initialConfig}>
            <EditorInner
              ref={editorRef as React.Ref<PromptEditorRef>}
              autoCompleteOptions={autoCompleteOptions}
              disabled={disabled}
              ariaLabel={ariaLabel}
              initialValue={initialValue}
              maxRows={maxRows}
              minRows={minRows}
              multiline={multiline}
              placeholder={placeholder}
              fillHeight={fillHeight}
              borderless={borderless}
              showToolbar={showToolbar}
              toolbarActionsRef={toolbarActionsRef}
              value={value}
              onChange={handleEditorChange}
            />
          </LexicalComposer>
        </div>
      </div>
    </TooltipProvider>
  );
};
