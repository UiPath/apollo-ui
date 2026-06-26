import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  getDOMSelectionFromTarget,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PromptEditorAutocompleteMenu } from '../components/PromptEditorAutocompleteMenu';
import type { PromptEditorAutoCompleteOption } from '../types';
import {
  inferTokenTypeFromPath,
  shouldSuppressOpenForDismissed,
  VARIABLE_PATH_REGEX,
} from '../utils/autocomplete-segments';
import { createTokenNodeForOption } from '../utils/insert-token';

const findTrigger = (
  text: string,
  cursorPos: number
): { triggerIndex: number; query: string } | null => {
  let triggerIndex = -1;
  for (let i = cursorPos - 1; i >= 0; i--) {
    const char = text[i];
    if (/\s/.test(char)) break;
    if (char === '$') {
      if (i === 0 || /\s/.test(text[i - 1])) triggerIndex = i;
      break;
    }
  }
  if (triggerIndex === -1) return null;
  return { triggerIndex, query: text.slice(triggerIndex + 1, cursorPos) };
};

interface VirtualAnchorElement {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
}

const getCaretRectForEditor = (editor: LexicalEditor): DOMRect => {
  const rootElement = editor.getRootElement();
  const fallbackRect = rootElement?.getBoundingClientRect() ?? new DOMRect();
  const domSelection = getDOMSelectionFromTarget(rootElement);
  if (!domSelection || domSelection.rangeCount === 0) return fallbackRect;

  const range = domSelection.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rects = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
  const rect = rects?.item(0) ?? range.getBoundingClientRect();
  if (!Number.isFinite(rect.x) || !Number.isFinite(rect.y)) return fallbackRect;
  if (rect.width === 0 && rect.height === 0) return fallbackRect;
  return rect;
};

/**
 * Drives the `$`-trigger flow: detects when the user has typed a `$` in a valid trigger context,
 * opens `<VariablePickerAutocompleteMenu>` anchored to the caret, threads selection back into a
 * Lexical token chip on commit, and handles dismissal (Escape, click-outside, scroll, free-form
 * Enter on a typed-but-unmatched `$prefix.path`).
 *
 * The picker (a wrapper around the canvas-wide `VariablePicker`) owns search, drill-in, and
 * keyboard navigation while it has focus. This plugin only handles the parts that have to live in
 * the Lexical editor: trigger detection, dismissal sentinel, free-form Enter fallback after
 * dismissal, and refocusing the editor when the picker closes.
 */
export const AutocompletePlugin = ({ options }: { options: PromptEditorAutoCompleteOption[] }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | VirtualAnchorElement | null>(null);
  // Tracks the user's typed prefix after `$` so the `VariablePicker` can pre-fill its search box
  // with whatever the user has already typed (e.g. `$vars.start.` → search seeded with `vars.start.`).
  const [query, setQuery] = useState('');

  const triggerInfoRef = useRef<{ triggerIndex: number; nodeKey: string } | null>(null);
  // Snapshot of the last `$` position the picker was dismissed for. Used to suppress reopening when
  // the user clicks back to the same `$` after dismissing — gives them a window to Backspace it
  // without the picker re-grabbing focus. Reset whenever the editor's text content changes (any new
  // typing means the user re-engaged the trigger flow).
  const dismissedTriggerRef = useRef<{ triggerIndex: number; nodeKey: string } | null>(null);
  const optionsRef = useRef(options);

  const openRef = useRef(open);

  useEffect(() => {
    optionsRef.current = options;
    openRef.current = open;
  });

  const closeMenu = useCallback(
    (explicit = false) => {
      // Only remember the dismissed `$` position on an *explicit* dismissal (Escape / click-outside),
      // so the update listener can suppress re-opening for that exact position. Auto-closes from the
      // update listener (selection moved, whitespace typed, no trigger) must NOT snapshot — otherwise
      // moving the caret back to the same `$` would be wrongly suppressed. Cleared when the user types.
      const wasOpen = openRef.current;
      if (explicit && triggerInfoRef.current)
        dismissedTriggerRef.current = { ...triggerInfoRef.current };
      setOpen(false);
      setAnchorEl(null);
      // Keep the trigger sentinel on an *explicit* dismissal (Escape / click-outside) so the user can
      // still press Enter to commit a typed-but-unmatched `$path` as a free-form chip — the KEY_ENTER
      // handler needs `triggerInfoRef`. Non-explicit auto-closes (commit done, cursor moved off the
      // trigger, no trigger found) clear it; the update listener's no-trigger path also calls this
      // non-explicitly once the caret actually leaves the `$`, so the sentinel can't dangle.
      if (!explicit) triggerInfoRef.current = null;
      // Refocus the editor only when an open picker is actually closing (Escape, click-outside,
      // selection-commit). Without this guard, every "no trigger detected" close path would call
      // editor.focus() — Lexical's focus() runs an internal editor.update() that re-fires the same
      // update listener, creating an infinite recursion that froze the properties panel on mount.
      if (wasOpen) editor.focus();
    },
    [editor]
  );

  /** Commit a chip with the given option's value. Used by the picker's onSelect adapter and free-form Enter. */
  const commitChip = useCallback(
    (option: PromptEditorAutoCompleteOption) => {
      const triggerInfo = triggerInfoRef.current;
      if (!triggerInfo) return;

      editor.update(() => {
        const selection = $getSelection();
        if (!selection || !$isRangeSelection(selection)) return;
        const anchorNode = selection.anchor.getNode();
        if (!$isTextNode(anchorNode)) return;
        // The trigger sentinel is captured against a specific text node. If the cursor has since
        // jumped to a different node — e.g. the user moved the caret, or a `queueMicrotask` deferred
        // the commit past a node split — `triggerInfo.triggerIndex` is no longer a valid offset
        // into `anchorNode.getTextContent()`. Bail rather than slice the wrong content.
        if (anchorNode.getKey() !== triggerInfo.nodeKey) return;

        const textContent = anchorNode.getTextContent();
        const cursorOffset = selection.anchor.offset;
        const textBefore = textContent.slice(0, triggerInfo.triggerIndex);
        const textAfter = textContent.slice(cursorOffset);

        const tokenNode = createTokenNodeForOption(option);

        if (textBefore) {
          anchorNode.setTextContent(textBefore);
          anchorNode.insertAfter(tokenNode);
        } else {
          anchorNode.replace(tokenNode);
        }

        if (textAfter) {
          const textAfterNode = $createTextNode(textAfter);
          tokenNode.insertAfter(textAfterNode);
          textAfterNode.select(0, 0);
        } else {
          tokenNode.selectNext(0, 0);
        }
      });

      closeMenu();
    },
    [closeMenu, editor]
  );

  /**
   * Free-form commit: typed text doesn't match any expanded option, but is a syntactically valid
   * `$prefix.path`. Commit it verbatim as a chip — `ValidateTokensPlugin` will mark it red so the user
   * sees the resolution gap, but the leaf segment is preserved instead of silently dropped. Reachable
   * after dismissal (Escape) when the trigger sentinel is still set: the user can keep typing and
   * press Enter to commit the typed path. Returns `true` if a chip was committed.
   */
  const commitTypedAsChip = useCallback((): boolean => {
    const triggerInfo = triggerInfoRef.current;
    if (!triggerInfo) return false;

    let committed = false;
    editor.read(() => {
      const selection = $getSelection();
      if (!selection || !$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      if (!$isTextNode(anchorNode)) return;
      // Same anchor-node sanity check as `commitChip`: the typed-prefix slice below uses
      // `triggerInfo.triggerIndex` as an offset into `anchorNode.getTextContent()`, which is only
      // meaningful when the anchor still matches the node the trigger sentinel was captured against.
      if (anchorNode.getKey() !== triggerInfo.nodeKey) return;

      const textContent = anchorNode.getTextContent();
      const cursorOffset = selection.anchor.offset;
      const typedQuery = textContent.slice(triggerInfo.triggerIndex + 1, cursorOffset);
      if (!VARIABLE_PATH_REGEX.test(typedQuery)) return;

      // Commit the path WITHOUT the `$` trigger char so the chip value matches the convention used
      // by menu-selected chips and `autoCompleteOptions` (e.g. `vars.foo`), keeping type inference
      // and `ValidateTokensPlugin` validation consistent.
      const inferredType = inferTokenTypeFromPath(typedQuery, optionsRef.current);
      committed = true;
      // Defer the actual mutation until after we exit the read.
      queueMicrotask(() => commitChip({ type: inferredType, value: typedQuery }));
    });
    return committed;
  }, [commitChip, editor]);

  /**
   * Open the picker for a freshly-detected `$` trigger. Extracted from the update listener so the
   * `() => caretRect` lambda inside `setAnchorEl` doesn't bury us five callbacks deep
   * (component → useEffect → registerUpdateListener → editorState.read → arrow), which Sonar's
   * nested-callback rule flags. With the extraction, the lambda lives at depth 3 instead.
   */
  const openPickerForTrigger = useCallback(
    (trigger: { triggerIndex: number; query: string }, anchorNodeKey: string) => {
      triggerInfoRef.current = { triggerIndex: trigger.triggerIndex, nodeKey: anchorNodeKey };
      setQuery(trigger.query);

      try {
        const domSelection = getDOMSelectionFromTarget(editor.getRootElement());
        if (domSelection && domSelection.rangeCount > 0) {
          // Capture the caret's position relative to the editor root NOW, while the DOM selection
          // is still valid. Once the picker mounts, its search input auto-focuses and the editor's
          // selection is dropped — so we can never recompute the caret rect from selection again.
          // Instead, save the offset from the editor root's current rect and reconstruct the live
          // caret rect on every `getBoundingClientRect()` call from the editor root's *current*
          // screen position. The editor root's `getBoundingClientRect()` is always live (no
          // selection needed), so as the page scrolls, the popover anchor naturally tracks.
          const editorRoot = editor.getRootElement();
          const caretRect = getCaretRectForEditor(editor);
          const editorRect = editorRoot?.getBoundingClientRect() ?? new DOMRect();
          const offsetTop = caretRect.top - editorRect.top;
          const offsetLeft = caretRect.left - editorRect.left;
          const caretWidth = caretRect.width;
          const caretHeight = caretRect.height;
          setAnchorEl({
            getBoundingClientRect: () => {
              const live = editorRoot?.getBoundingClientRect() ?? new DOMRect();
              return new DOMRect(
                live.left + offsetLeft,
                live.top + offsetTop,
                caretWidth,
                caretHeight
              );
            },
            contextElement: editorRoot ?? undefined,
          });
          setOpen(true);
        } else {
          closeMenu();
        }
      } catch {
        closeMenu();
      }
    },
    [closeMenu, editor]
  );

  useEffect(() => {
    // Track the last text content in a closure so each update reads the document once (current)
    // rather than traversing both prev and current states via getTextContent() on every keystroke.
    let lastText = editor.getEditorState().read(() => $getRoot().getTextContent());
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        // Detect whether this update changed the editor's text content (vs. just moving the
        // selection / cursor). Any text change means the user re-engaged the trigger flow, so we
        // forget the dismissed-`$` sentinel and let the next valid trigger open the picker fresh.
        const currText = editorState.read(() => $getRoot().getTextContent());
        const textChanged = currText !== lastText;
        lastText = currText;
        if (textChanged) dismissedTriggerRef.current = null;

        editorState.read(() => {
          const selection = $getSelection();
          if (!selection || !$isRangeSelection(selection) || !selection.isCollapsed()) {
            closeMenu();
            return;
          }

          const anchorNode = selection.anchor.getNode();
          if (!$isTextNode(anchorNode)) {
            closeMenu();
            return;
          }

          const textContent = anchorNode.getTextContent();
          const trigger = findTrigger(textContent, selection.anchor.offset);
          if (!trigger) {
            closeMenu();
            return;
          }

          // Suppress reopening when the user has already dismissed this exact `$` position. They
          // may have clicked away and back, or pressed Escape and parked the cursor next to the
          // `$` — either way they want a window to Backspace without the picker grabbing focus.
          if (
            shouldSuppressOpenForDismissed(
              { triggerIndex: trigger.triggerIndex, nodeKey: anchorNode.getKey() },
              dismissedTriggerRef.current
            )
          ) {
            return;
          }

          openPickerForTrigger(trigger, anchorNode.getKey());
        });
      }),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          // Reachable when the user has typed a `$prefix.path` that doesn't match any scope entry,
          // dismissed the picker, then pressed Enter to commit the typed text verbatim. The picker
          // intercepts Enter while it has focus, so this handler only fires when focus is back on
          // the editor and the trigger sentinel is still set.
          if (!triggerInfoRef.current) return false;
          if (commitTypedAsChip()) {
            event?.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!openRef.current && !triggerInfoRef.current) return false;
          closeMenu(true); // explicit dismissal — remember this `$` so it doesn't immediately reopen
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [closeMenu, commitTypedAsChip, editor, openPickerForTrigger]);

  /**
   * The menu hands us the selected path; translate to the `{ type, value }` shape `commitChip`
   * expects. The token type is looked up from the option set (exact match → the option's own type;
   * otherwise inferred from the closest known ancestor path) so the chip renders as the correct
   * workflow-role for validation purposes.
   */
  const handleVariablePickerSelect = useCallback(
    (path: string) => {
      const inferredType = inferTokenTypeFromPath(path, optionsRef.current);
      commitChip({ type: inferredType, value: path });
    },
    [commitChip]
  );

  return (
    <PromptEditorAutocompleteMenu
      open={open}
      anchorEl={anchorEl}
      initialSearch={query}
      options={options}
      onSelect={handleVariablePickerSelect}
      onCommitFreeForm={handleVariablePickerSelect}
      onClose={() => closeMenu(true)}
    />
  );
};
