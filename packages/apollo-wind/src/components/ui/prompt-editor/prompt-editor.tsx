import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormFieldError } from '@/components/ui/form-field';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EditorToolbar } from './components/EditorToolbar';
import { MarkdownPreview, type MarkdownPreviewProps } from './components/MarkdownPreview';
import type { PromptEditorAutocompleteMenuProps } from './components/PromptEditorAutocompleteMenu';
import { InputTokenNode, OutputTokenNode, ResourceTokenNode, StateTokenNode } from './nodes';
import { AutocompletePlugin } from './plugins/AutocompletePlugin';
import { CopyPastePlugin } from './plugins/CopyPastePlugin';
import { EditorRefPlugin } from './plugins/EditorRefPlugin';
import { MultilinePlugin } from './plugins/MultilinePlugin';
import { NodeSelectionFixPlugin } from './plugins/NodeSelectionFixPlugin';
import { RenameTokensPlugin } from './plugins/RenameTokensPlugin';
import { ToolbarActionsPlugin } from './plugins/ToolbarActionsPlugin';
import { ValidateTokensPlugin } from './plugins/ValidateTokensPlugin';
import { ValueSyncPlugin } from './plugins/ValueSyncPlugin';
import { VariableDropPlugin } from './plugins/VariableDropPlugin';
import {
  DEFAULT_PROMPT_EDITOR_STRINGS,
  PromptEditorConfigProvider,
  type PromptEditorRenderTokenPill,
  type PromptEditorStrings,
} from './prompt-editor-config';
import type {
  PromptEditorAutoCompleteOption,
  PromptEditorMode,
  PromptEditorToken,
  PromptEditorToolbarActionsRef,
  PromptEditorToolbarActiveFormats,
} from './types';
import {
  $getEditorTokensInternal,
  $insertTokenAtCursor,
  $setEditorTokensInternal,
  areTokensEqual,
} from './utils';
import {
  $getRichEditorTokensInternal,
  $setRichEditorTokensInternal,
  PROMPT_EDITOR_RICH_TRANSFORMERS,
  RICH_EDITOR_EXTRA_NODES,
} from './utils/rich-serialization';

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
  /** Field-specific validation feedback rendered below the editor. */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  /** Additional description id(s) associated with the editor. */
  'aria-describedby'?: string;
  /** @deprecated Use the native `aria-describedby` prop instead. */
  ariaDescribedBy?: string;
  /**
   * Enable variable drag-drop: map a path dropped onto the editor (see `VARIABLE_DRAG_MIME`) to the
   * token to insert at the drop point. The drag *source* is the consumer's (it sets the path on
   * `dataTransfer`); omit this prop to disable drop handling entirely.
   */
  mapVarDropToToken?: (insertPath: string) => PromptEditorAutoCompleteOption;
  /**
   * Token values chips are validated against. Defaults to `autoCompleteOptions`. Pass a wider set
   * when values can be valid without being offered by autocomplete (e.g. runtime-only paths) —
   * merging them into `autoCompleteOptions` instead would pollute the `$`-trigger menu.
   */
  validationOptions?: PromptEditorAutoCompleteOption[];
  /**
   * Replace the built-in `$`-trigger autocomplete menu with a consumer-supplied one. Receives the
   * exact props the built-in menu would get (anchor, seeded search, options, select/close
   * callbacks). Also enables the `$` trigger when `autoCompleteOptions` is empty, since the
   * consumer's menu may source its own entries.
   */
  renderAutocompleteMenu?: (props: PromptEditorAutocompleteMenuProps) => React.ReactNode;
  /**
   * Replace (or decorate — the built-in pill is passed as `defaultPill`) the rendered token chips.
   */
  renderTokenPill?: PromptEditorRenderTokenPill;
  /** Overridable user-facing strings for localizing hosts. Merged over the built-in English. */
  strings?: Partial<PromptEditorStrings>;
  /**
   * Whether the toolbar's Edit/Preview switcher renders (only meaningful with `showToolbar`).
   * When false the formatting cluster left-aligns and `toolbarTrailing` right-aligns, and the
   * editor never enters preview mode. Defaults to true.
   */
  showModeToggle?: boolean;
  /** Consumer-supplied node at the toolbar's right end (e.g. a value-mode menu). */
  toolbarTrailing?: React.ReactNode;
  /** Extra Lexical plugins mounted inside the composer (e.g. host-specific drop/replace plugins). */
  children?: React.ReactNode;
  /**
   * Per-token pill override for PREVIEW mode, so preview pills can match the host's edit-mode pills
   * (icon markup and/or label). See {@link MarkdownPreviewTokenOverride}.
   */
  previewToken?: MarkdownPreviewProps['previewToken'];
  /**
   * WYSIWYG mode: formatting renders live in the editor (real bold/italic/strike and lists) instead
   * of markdown markers with a separate preview. The `PromptEditorToken[]` contract is unchanged —
   * text tokens still carry markdown; the conversion happens at the editor boundary. Mount-time
   * only (it feeds the composer's frozen `initialConfig`); requires `multiline`. In rich mode the
   * Edit/Preview switcher and `mode='preview'` are inert — the editor IS the preview.
   */
  richText?: boolean;
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
  /** Rich mode: reports the selection's active formats up for the toolbar's pressed states. */
  onActiveFormatsChange?: (formats: PromptEditorToolbarActiveFormats) => void;
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
      error,
      errorId,
      ariaDescribedBy,
      mapVarDropToToken,
      validationOptions,
      renderAutocompleteMenu,
      toolbarActionsRef,
      showToolbar,
      children,
      richText,
      onActiveFormatsChange,
    }: EditorInnerProps,
    ref: React.ForwardedRef<PromptEditorRef>
  ) => {
    const editorRef = useRef<LexicalEditor | null>(null);
    // Mode-aware serialization, picked once (richText is mount-time-only): rich mode converts
    // formatted nodes ⇄ markdown text tokens; plain mode walks flat paragraphs.
    const $getTokens = richText ? $getRichEditorTokensInternal : $getEditorTokensInternal;
    const $setTokens = richText ? $setRichEditorTokensInternal : $setEditorTokensInternal;
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
            // The update triggers OnChangePlugin → handleChange, which emits `onChange` once from the
            // resulting state. Don't also call onChange here, or controlled consumers get a duplicate
            // emit per setTokens() (extra renders / feedback loops).
            editorRef.current.update(() => {
              $setTokens(tokens);
            });
          } else {
            // No editor mounted yet → no OnChangePlugin emit, so notify directly.
            onChangeRef.current?.(tokens);
          }
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
      [$setTokens]
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

    // biome-ignore lint/correctness/useExhaustiveDependencies($getTokens): mode-picked once at mount (richText is mount-time-only), so the getter identity is stable.
    const handleChange = useCallback(() => {
      if (!editorRef.current) return;

      editorRef.current.getEditorState().read(() => {
        const tokens = $getTokens();
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
          $setTokens(valueToSet);
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

    // Focus chrome matches apollo's inputs (ring-2 ring-ring + future offset). With a toolbar the
    // ring lives on the FRAME (outer container) instead — a body-only ring drew its top edge as a
    // stray line under the toolbar.
    const shellFocusClasses = showToolbar
      ? ''
      : ' focus-within:ring-2 focus-within:ring-ring future:focus-within:ring-offset-2 future:focus-within:ring-offset-background';
    const wrapperClassName = borderless
      ? 'flex flex-col w-full relative'
      : `prompt-editor-shell flex flex-col w-full relative border bg-background future:border-0 future:bg-surface-overlay ${showToolbar ? 'border-t-0 rounded-b-md future:rounded-b-xl' : 'rounded-md future:rounded-xl'} ${error ? 'border-error ring-1 ring-error/20 future:ring-error/40' : ''}${shellFocusClasses}`;

    return (
      <div
        className={wrapperClassName}
        data-invalid={error ? 'true' : undefined}
        style={{
          fontFamily: "'Noto Sans', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
        }}
      >
        <style>{`
          .prompt-editor-paragraph { padding: 0; margin: 0; }
          .prompt-editor-root *::selection { background-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }
          ${
            richText
              ? `
          /* Rich-mode formatting — metrics mirror MarkdownPreview so editing matches rendering. */
          .prompt-editor-text-bold { font-weight: 700; }
          .prompt-editor-text-italic { font-style: italic; }
          .prompt-editor-text-strikethrough { text-decoration: line-through; }
          .prompt-editor-list-ul, .prompt-editor-list-ol { margin: 0.25em 0; padding-left: 1.5em; }
          .prompt-editor-list-ul { list-style-type: disc; }
          .prompt-editor-list-ol { list-style-type: decimal; }
          .prompt-editor-list-item { margin: 0.125em 0; }
          .prompt-editor-list-item-nested { list-style-type: none; }
          `
              : ''
          }
        `}</style>
        <div
          className="prompt-editor-root"
          style={{
            position: 'relative',
            ...(fillHeight
              ? {
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }
              : {}),
          }}
        >
          {richText ? (
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  style={contentEditableStyle}
                  ariaLabel={ariaLabel}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={ariaDescribedBy}
                  aria-errormessage={error ? errorId : undefined}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
          ) : (
            <PlainTextPlugin
              contentEditable={
                <ContentEditable
                  style={contentEditableStyle}
                  ariaLabel={ariaLabel}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={ariaDescribedBy}
                  aria-errormessage={error ? errorId : undefined}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
          )}
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
              className="text-muted-foreground future:text-foreground-muted future:font-normal"
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
          richText={richText}
        />
        {/* MultilinePlugin collapses the whole root into one paragraph — plain-mode only; rich
            mode requires multiline and its lists would be destroyed by the collapse. */}
        {!richText && <MultilinePlugin multiline={multiline} />}
        {richText && (
          <>
            <ListPlugin />
            {/* Live markdown shortcuts: typing `**x**` bolds, `- ` starts a list, matching the
                toolbar's feature set exactly (the transformer list is shared with serialization). */}
            <MarkdownShortcutPlugin transformers={PROMPT_EDITOR_RICH_TRANSFORMERS} />
          </>
        )}
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <ToolbarActionsPlugin
          actionsRef={toolbarActionsRef}
          richText={richText}
          onActiveFormatsChange={onActiveFormatsChange}
        />
        {(options.length > 0 || renderAutocompleteMenu) && (
          <AutocompletePlugin options={options} renderMenu={renderAutocompleteMenu} />
        )}
        <ValidateTokensPlugin
          options={Array.isArray(validationOptions) ? validationOptions : options}
        />
        {options.length > 0 && <RenameTokensPlugin options={options} onChange={onChange} />}
        {mapVarDropToToken && (
          <VariableDropPlugin mapVarDropToToken={mapVarDropToToken} disabled={disabled} />
        )}
        {children}
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
  error,
  errorId: providedErrorId,
  'aria-describedby': nativeAriaDescribedBy,
  ariaDescribedBy: legacyAriaDescribedBy,
  mapVarDropToToken,
  validationOptions,
  renderAutocompleteMenu,
  renderTokenPill,
  strings: partialStrings,
  showModeToggle = true,
  toolbarTrailing,
  children,
  richText: richTextProp,
  previewToken,
}: PromptEditorProps) => {
  // Normalize the token-array props once so malformed input (e.g. `{}` from a Storybook object
  // control) can't crash the editor, the preview, or ValueSyncPlugin.
  const value = toTokenArray(rawValue);
  const initialValue = toTokenArray(rawInitialValue);

  // Rich mode requires multiline (lists/paragraph structure make no sense in a one-line field).
  // MOUNT-TIME ONLY: the first render's value feeds the composer's frozen initialConfig.
  const [richText] = useState(() => {
    if (richTextProp && !multiline) {
      console.warn('PromptEditor: richText requires multiline — falling back to the plain editor.');
      return false;
    }
    return !!richTextProp;
  });

  const [internalMode, setInternalMode] = useState<PromptEditorMode>('edit');
  // Without the Edit/Preview switcher there is no way (or reason) to enter preview mode; in rich
  // mode the editor IS the preview, so preview mode is inert there too.
  const mode = showModeToggle && !richText ? (controlledMode ?? internalMode) : 'edit';
  const toolbarActionsRef = useRef<PromptEditorToolbarActionsRef | null>(null);
  const [activeFormats, setActiveFormats] = useState<PromptEditorToolbarActiveFormats | undefined>(
    undefined
  );
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
      theme: {
        paragraph: 'prompt-editor-paragraph',
        ...(richText
          ? {
              text: {
                bold: 'prompt-editor-text-bold',
                italic: 'prompt-editor-text-italic',
                strikethrough: 'prompt-editor-text-strikethrough',
              },
              list: {
                ul: 'prompt-editor-list-ul',
                ol: 'prompt-editor-list-ol',
                listitem: 'prompt-editor-list-item',
                nested: { listitem: 'prompt-editor-list-item-nested' },
              },
            }
          : {}),
      },
      onError: (error: Error) => console.error('PromptEditor error:', error),
      nodes: [
        InputTokenNode,
        OutputTokenNode,
        StateTokenNode,
        ResourceTokenNode,
        ...(richText ? RICH_EDITOR_EXTRA_NODES : []),
      ],
    }),
    [richText]
  );

  const isControlled = value !== undefined;
  const previewTokens = isControlled ? value : uncontrolledPreviewTokens;
  const generatedErrorId = useId();
  const errorId = providedErrorId ?? `prompt-editor-${generatedErrorId.replace(/:/g, '')}-error`;
  // Prefer the native prop while accepting the legacy camelCase alias for compatibility.
  const additionalDescribedBy = nativeAriaDescribedBy ?? legacyAriaDescribedBy;
  const describedBy = [additionalDescribedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  const handleEditorChange = useCallback(
    (tokens: PromptEditorToken[]) => {
      if (!isControlled) setUncontrolledPreviewTokens(tokens);
      onChange?.(tokens);
    },
    [isControlled, onChange]
  );

  const strings = useMemo<PromptEditorStrings>(
    () => ({ ...DEFAULT_PROMPT_EDITOR_STRINGS, ...partialStrings }),
    [partialStrings]
  );
  const editorConfig = useMemo(() => ({ renderTokenPill, strings }), [renderTokenPill, strings]);

  return (
    <PromptEditorConfigProvider value={editorConfig}>
      <TooltipProvider>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
          }}
        >
          {/* With a toolbar, the FRAME (toolbar + body — NOT the validation message below) is the
              focus target: a body-only focus ring drew its top edge as a stray line directly under
              the toolbar. The ring itself is the exact treatment apollo's inputs use
              (ring-2 ring-ring + future offset). */}
          <div
            className={
              showToolbar && !borderless
                ? 'prompt-editor-frame rounded-md future:rounded-xl focus-within:ring-2 focus-within:ring-ring future:focus-within:ring-offset-2 future:focus-within:ring-offset-background'
                : undefined
            }
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
                error={Boolean(error)}
                actionsRef={toolbarActionsRef}
                onModeChange={handleModeChange}
                onFullscreen={onFullscreen}
                showModeToggle={showModeToggle && !richText}
                trailing={toolbarTrailing}
                strings={strings}
                activeFormats={richText ? activeFormats : undefined}
              />
            )}

            {/* Preview mode — mirror `borderless`: when set, the parent supplies the chrome, so drop
            the editor's own border/background here too (keeps edit/preview consistent). */}
            {mode === 'preview' && (
              <div
                data-invalid={error ? 'true' : undefined}
                className={
                  borderless
                    ? undefined
                    : `border bg-background future:border-0 future:bg-surface-overlay ${showToolbar ? 'border-t-0 rounded-b-md future:rounded-b-xl' : 'rounded-md future:rounded-xl'} ${error ? 'border-error ring-1 ring-error/20 future:ring-error/40' : ''}`
                }
              >
                <MarkdownPreview
                  tokens={previewTokens}
                  minRows={minRows}
                  previewToken={previewToken}
                />
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
                  error={error}
                  errorId={error ? errorId : undefined}
                  ariaDescribedBy={describedBy || undefined}
                  initialValue={initialValue}
                  maxRows={maxRows}
                  minRows={minRows}
                  multiline={multiline}
                  placeholder={placeholder}
                  fillHeight={fillHeight}
                  borderless={borderless}
                  mapVarDropToToken={mapVarDropToToken}
                  validationOptions={validationOptions}
                  renderAutocompleteMenu={renderAutocompleteMenu}
                  showToolbar={showToolbar}
                  toolbarActionsRef={toolbarActionsRef}
                  value={value}
                  onChange={handleEditorChange}
                  richText={richText}
                  onActiveFormatsChange={richText ? setActiveFormats : undefined}
                >
                  {children}
                </EditorInner>
              </LexicalComposer>
            </div>
          </div>
          <FormFieldError id={errorId} data-slot="prompt-editor-error" className="mt-1">
            {error}
          </FormFieldError>
        </div>
      </TooltipProvider>
    </PromptEditorConfigProvider>
  );
};
