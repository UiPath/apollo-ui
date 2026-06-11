import { Database, Paperclip, SquareFunction, Variable } from 'lucide-react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  getPromptEditorTokenTypeLabel,
  type PromptEditorAutoCompleteOption,
  type PromptEditorTokenType,
} from '../types';

const MENU_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

const OPTION_ICON: Record<
  Exclude<PromptEditorTokenType, 'text'>,
  React.ComponentType<{ className?: string }>
> = {
  input: Variable,
  output: SquareFunction,
  state: Database,
  resource: Paperclip,
};

export interface PromptEditorAutocompleteMenuProps {
  open: boolean;
  anchorEl: { getBoundingClientRect: () => DOMRect; contextElement?: Element } | null;
  /** Pre-fill the search input with the user's typed prefix (everything after `$`). */
  initialSearch: string;
  /** Variable options to offer. */
  options: PromptEditorAutoCompleteOption[];
  /** Called with the selected option's value (path). */
  onSelect: (path: string) => void;
  /** Called when the menu should close (Escape, click-outside, selection committed). */
  onClose: () => void;
}

/**
 * Resolve the portal target. When the editor lives inside a Radix Dialog, portal into the dialog's
 * content node so the menu joins the dialog's focus scope — otherwise the focus trap steals focus
 * back the moment the menu's search input mounts. Everything else portals to `document.body` so
 * ancestor `opacity` / `filter` / `transform` can't leak through.
 */
function resolvePortalTarget(contextElement: Element | null | undefined): HTMLElement {
  const dialogContent = contextElement?.closest?.('[role="dialog"]');
  if (dialogContent instanceof HTMLElement) return dialogContent;
  return document.body;
}

/**
 * Caret-anchored variable picker for the prompt editor's `$` trigger. Built on apollo-wind's
 * `Command` (cmdk) for search + keyboard nav, anchored to the Lexical caret rect via a
 * `position: fixed` container that tracks the caret across scroll/resize.
 */
export const PromptEditorAutocompleteMenu = ({
  open,
  anchorEl,
  initialSearch,
  options,
  onSelect,
  onClose,
}: PromptEditorAutocompleteMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState(initialSearch);

  // Re-seed the search box whenever the trigger re-opens with a different typed prefix.
  useEffect(() => {
    if (open) setSearch(initialSearch);
  }, [open, initialSearch]);

  // Click-outside → close. Pointerdown so we beat the editor's selection capture.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, onClose]);

  // Track the live caret rect across ancestor scrolls and window resizes so the menu follows the
  // caret. The `anchorEl.getBoundingClientRect()` payload is itself live (computed from the editor
  // root's current screen position + a saved offset), so the rect is read directly during render; a
  // counter bumped on scroll/resize forces the re-read. Scrolls *inside* the menu are ignored.
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0);
  useEffect(() => {
    if (!open || !anchorEl) return;
    let rafId: number | null = null;
    const onScrollOrResize = (event: Event) => {
      if (event.type === 'scroll' && containerRef.current?.contains(event.target as Node)) return;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        forceUpdate();
      });
    };
    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [open, anchorEl]);

  // Stop pointer events from bubbling past the menu: a mousedown inside would otherwise transfer
  // focus and drop the editor's caret, and (when portaled to body inside a Radix Dialog) trip the
  // dialog's `onInteractOutside`. The search input still receives focus via cmdk's autofocus.
  useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;
    const handlePointerDown = (e: PointerEvent) => {
      // preventDefault suppresses the follow-up mousedown so the browser can't move focus off the
      // Lexical editor before `commitChip` runs — keeping the trigger node's caret/key valid even if
      // a racing state update would otherwise invalidate `triggerInfo.nodeKey`.
      e.preventDefault();
      e.stopPropagation();
    };
    node.addEventListener('pointerdown', handlePointerDown);
    return () => node.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN)
  );
  const portalTarget = resolvePortalTarget(anchorEl.contextElement);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: positioning wrapper that forwards Escape to close; the interactive surface is the cmdk Command (a combobox with its own keyboard handling).
    <div
      ref={containerRef}
      data-variable-picker-popover=""
      className="rounded-md border bg-popover shadow-lg"
      style={{ position: 'fixed', top: rect.bottom + 4, left, width: MENU_WIDTH, zIndex: 1400 }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <Command shouldFilter loop>
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search variables…"
          autoFocus
        />
        <CommandList>
          <CommandEmpty>No variables found.</CommandEmpty>
          {options.map((option) => {
            const Icon = OPTION_ICON[option.type];
            return (
              <CommandItem
                key={`${option.type}:${option.value}`}
                value={option.value}
                onSelect={() => onSelect(option.value)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{option.value}</span>
                <span className="ml-auto pl-2 text-xs text-muted-foreground">
                  {getPromptEditorTokenTypeLabel(option.type)}
                </span>
              </CommandItem>
            );
          })}
        </CommandList>
      </Command>
    </div>,
    portalTarget
  );
};
