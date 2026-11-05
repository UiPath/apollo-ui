import { ComponentIcon, DocumentIcon, SearchIcon, TimeIcon } from '@storybook/icons';
import React, {
  type KeyboardEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { type API, addons } from 'storybook/manager-api';
import type { StorybookTheme } from 'storybook/theming';
import {
  type LibraryKey,
  type LoadedIndex,
  libraryFor,
  loadSearchIndex,
  type SearchGroup,
  type SearchHit,
} from './engine';
import { type ScrollToPayload, SEARCH_OPEN, SEARCH_SCROLL_TO } from './events';

const RECENT_KEY = 'apollo-storybook-search:recent';
const MAX_RECENT = 6;

let indexPromise: Promise<LoadedIndex> | null = null;
const getIndex = () => {
  indexPromise ??= loadSearchIndex().catch((error) => {
    indexPromise = null;
    throw error;
  });
  return indexPromise;
};

interface Destination {
  entryId: string;
  entryType: 'docs' | 'story';
  anchor: string;
  heading: string;
  tabs?: string[];
}

interface RecentItem extends Destination {
  title: string;
  /** Full Storybook title, used to show the library badge. */
  path?: string;
  label: string;
}

function readRecent(): RecentItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: RecentItem) {
  try {
    const next = [
      item,
      ...readRecent().filter((r) => !(r.entryId === item.entryId && r.heading === item.heading)),
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable, recents are a convenience only
  }
}

/** Library colors, tuned for contrast on Storybook's light and dark surfaces. */
const LIBRARY_COLORS: Record<'light' | 'dark', Record<LibraryKey, string>> = {
  light: {
    wind: '#0b67d0',
    react: '#6b3fd4',
    material: '#a15c00',
    core: '#087a5b',
    other: '#5c6470',
  },
  dark: {
    wind: '#5cb4ff',
    react: '#b794ff',
    material: '#f2b552',
    core: '#5fd3b3',
    other: '#a3abb8',
  },
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps matched terms in <mark>. Terms come from the search engine. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <>{parts.map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part))}</>
  );
}

function LibraryBadge({ library, label }: { library: LibraryKey; label: string }) {
  return (
    <span className="apollo-search__badge" data-library={library}>
      {label}
      {library === 'material' && <span className="apollo-search__badge-flag">Legacy</span>}
    </span>
  );
}

type Row =
  | { kind: 'group'; key: string; group: SearchGroup }
  | { kind: 'hit'; key: string; group: SearchGroup; hit: SearchHit }
  | { kind: 'recent'; key: string; item: RecentItem };

interface SearchDialogProps {
  api: API;
  theme: StorybookTheme;
  initialQuery: string;
  onClose: () => void;
}

function SearchDialog({ api, theme, initialQuery, onClose }: SearchDialogProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [index, setIndex] = useState<LoadedIndex | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const [recent] = useState(readRecent);

  useEffect(() => {
    let cancelled = false;
    getIndex()
      .then((loaded) => !cancelled && setIndex(loaded))
      .catch(() => !cancelled && setLoadError(true));
    // When opened from the preview, focus is still inside the iframe. Pull it
    // back to the manager window first or the input can't take it.
    window.focus();
    inputRef.current?.focus();
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const groups = useMemo(
    () => (index && deferredQuery.trim() ? index.search(deferredQuery) : []),
    [index, deferredQuery]
  );

  const rows = useMemo<Row[]>(() => {
    if (!deferredQuery.trim()) {
      return recent.map((item) => ({
        kind: 'recent',
        key: `r-${item.entryId}-${item.heading}`,
        item,
      }));
    }
    return groups.flatMap((group) => [
      { kind: 'group' as const, key: `g-${group.title}`, group },
      ...group.hits.map((hit) => ({ kind: 'hit' as const, key: hit.key, group, hit })),
    ]);
  }, [groups, recent, deferredQuery]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const open = useCallback(
    (destination: Destination, recentItem: RecentItem) => {
      saveRecent(recentItem);
      onClose();
      api.navigate(
        `/${destination.entryType === 'docs' ? 'docs' : 'story'}/${destination.entryId}`
      );
      if (destination.anchor || destination.heading || destination.tabs?.length) {
        const payload: ScrollToPayload = {
          entryId: destination.entryId,
          anchor: destination.anchor,
          heading: destination.heading,
          tabs: destination.tabs,
        };
        addons.getChannel().emit(SEARCH_SCROLL_TO, payload);
      }
    },
    [api, onClose]
  );

  const activate = (row: Row) => {
    if (row.kind === 'recent') {
      open(row.item, row.item);
      return;
    }
    const { group } = row;
    const destination: Destination =
      row.kind === 'group'
        ? { entryId: group.entryId, entryType: group.entryType, anchor: '', heading: '' }
        : {
            entryId: row.hit.entryId,
            entryType: row.hit.entryType,
            anchor: row.hit.anchor,
            heading: row.hit.kind === 'section' ? row.hit.heading : '',
            tabs: row.hit.tabs,
          };
    open(destination, {
      ...destination,
      title: group.leaf,
      path: group.title,
      label: row.kind === 'hit' ? row.hit.label : '',
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Leave keys alone while an input method (IME) is composing, so Enter
    // confirms the candidate instead of opening a result.
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.max(0, Math.min(rows.length - 1, current + 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter') {
      const row = rows[active];
      if (row) {
        event.preventDefault();
        activate(row);
      }
    } else if (event.key === 'Tab') {
      // The input is the dialog's only focusable control. Keep focus in the
      // dialog so it can't move to the obscured page behind it.
      event.preventDefault();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const cssVars = {
    '--as-bg': theme.background.content,
    '--as-bg-app': theme.background.app,
    '--as-hover': theme.background.hoverable,
    '--as-text': theme.color.defaultText,
    '--as-muted': theme.textMutedColor,
    '--as-border': theme.appBorderColor,
    '--as-accent': theme.color.secondary,
    '--as-radius': `${theme.appBorderRadius}px`,
    '--as-font': theme.typography.fonts.base,
    '--as-mono': theme.typography.fonts.mono,
    ...Object.fromEntries(
      Object.entries(LIBRARY_COLORS[theme.base === 'dark' ? 'dark' : 'light']).map(
        ([key, color]) => [`--as-lib-${key}`, color]
      )
    ),
  } as React.CSSProperties;

  const trimmed = deferredQuery.trim();
  let lastLibrary = '';

  return (
    <div className="apollo-search" style={cssVars}>
      <style>{STYLES}</style>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click closes, Escape is handled on the input */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users close with Escape */}
      <div className="apollo-search__backdrop" onClick={onClose} />
      <div className="apollo-search__panel" role="dialog" aria-modal="true" aria-label="Search">
        <div className="apollo-search__field">
          <SearchIcon aria-hidden />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls={listId}
            aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Search components, guidance, and props"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
          <kbd>esc</kbd>
        </div>

        <div className="apollo-search__results" ref={listRef} id={listId} role="listbox">
          {loadError && (
            <p className="apollo-search__empty">The search index could not be loaded.</p>
          )}
          {!loadError && !index && <p className="apollo-search__empty">Loading the index…</p>}
          {index && !trimmed && recent.length === 0 && (
            <p className="apollo-search__empty">
              Search page titles, headings, guidance text, and prop names.
            </p>
          )}
          {index && !trimmed && recent.length > 0 && (
            <div className="apollo-search__section-label">Recent</div>
          )}
          {index && trimmed && groups.length === 0 && (
            <p className="apollo-search__empty">
              No results for <strong>“{trimmed}”</strong>.
            </p>
          )}

          {rows.map((row, rowIndex) => {
            const selected = rowIndex === active;
            const common = {
              id: `${listId}-${rowIndex}`,
              role: 'option',
              'aria-selected': selected,
              'data-row-index': rowIndex,
              'data-active': selected || undefined,
              onMouseMove: () => !selected && setActive(rowIndex),
              onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
              onClick: () => activate(row),
            };

            if (row.kind === 'recent') {
              const library = row.item.path ? libraryFor(row.item.path) : null;
              return (
                <div
                  key={row.key}
                  className="apollo-search__row"
                  data-library={library?.key}
                  {...common}
                >
                  <TimeIcon aria-hidden />
                  <span className="apollo-search__row-text">
                    <span className="apollo-search__title">{row.item.title}</span>
                    {row.item.label && (
                      <span className="apollo-search__meta">{row.item.label}</span>
                    )}
                  </span>
                  {library?.badge && <LibraryBadge library={library.key} label={library.badge} />}
                </div>
              );
            }

            if (row.kind === 'group') {
              const { group } = row;
              const { library } = group;
              const showHeader = library.label !== lastLibrary;
              lastLibrary = library.label;
              return (
                <React.Fragment key={row.key}>
                  {showHeader && (
                    <div
                      className="apollo-search__library"
                      data-library={library.key}
                      role="presentation"
                    >
                      <span className="apollo-search__library-label">{library.label}</span>
                      {library.note && (
                        <span className="apollo-search__library-note">{library.note}</span>
                      )}
                    </div>
                  )}
                  <div
                    className="apollo-search__row apollo-search__row--group"
                    data-library={library.key}
                    {...common}
                  >
                    {group.entryType === 'docs' ? (
                      <DocumentIcon aria-hidden />
                    ) : (
                      <ComponentIcon aria-hidden />
                    )}
                    <span className="apollo-search__row-text">
                      <span className="apollo-search__title">
                        <Highlight text={group.leaf} terms={group.hits[0]?.terms ?? []} />
                      </span>
                      {group.breadcrumb && (
                        <span className="apollo-search__meta">{group.breadcrumb}</span>
                      )}
                    </span>
                    {library.badge && <LibraryBadge library={library.key} label={library.badge} />}
                  </div>
                </React.Fragment>
              );
            }

            const { hit } = row;
            return (
              <div
                key={row.key}
                className="apollo-search__row apollo-search__row--hit"
                data-library={row.group.library.key}
                {...common}
              >
                <span className="apollo-search__hash" aria-hidden>
                  {hit.kind === 'section' ? '#' : '›'}
                </span>
                <span className="apollo-search__row-text">
                  <span className="apollo-search__label">
                    <Highlight text={hit.label} terms={hit.terms} />
                  </span>
                  {hit.snippet && (
                    <span className="apollo-search__snippet">
                      <Highlight text={hit.snippet} terms={hit.terms} />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="apollo-search__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span className="apollo-search__status">
            {index &&
              (index.fullText
                ? `${index.sectionCount.toLocaleString()} sections indexed`
                : 'Titles only, full-text index not built')}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Storybook's own sidebar filter field. It becomes the search trigger. */
const SIDEBAR_FIELD_ID = 'storybook-explorer-searchfield';
const SIDEBAR_PLACEHOLDER = 'Search docs';

function SearchHost({ api, theme }: { api: API; theme: StorybookTheme }) {
  const [state, setState] = useState<{ open: boolean; query: string }>({
    open: false,
    query: '',
  });
  const returnFocus = useRef<HTMLElement | null>(null);
  const isOpen = useRef(false);

  const show = useCallback((query = '', returnTo: HTMLElement | null = null) => {
    // Already open (Cmd/Ctrl+K again, key repeat, or the preview shortcut): keep
    // the original return target instead of recording the search input.
    if (isOpen.current) return;
    isOpen.current = true;
    const active = returnTo ?? document.activeElement;
    // Never return focus to the sidebar field, focusing it reopens the search.
    returnFocus.current =
      active instanceof HTMLElement && active !== document.body && active.id !== SIDEBAR_FIELD_ID
        ? active
        : null;
    setState({ open: true, query });
  }, []);

  const hide = useCallback(() => {
    isOpen.current = false;
    setState({ open: false, query: '' });
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const isShortcut = (event: globalThis.KeyboardEvent) =>
      (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k';

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isShortcut(event)) return;
      // Runs before Storybook's own Cmd+K, which focuses the sidebar filter.
      event.preventDefault();
      event.stopImmediatePropagation();
      show();
    };

    // The sidebar field opens the search instead of filtering the tree.
    // Storybook must never see the field focused, or the sidebar swaps the tree
    // for its own results list. Pointer presses are cancelled before they focus
    // the field, and keyboard focus is hidden from Storybook's handlers.
    const isSidebarField = (target: EventTarget | null): target is HTMLInputElement =>
      target instanceof HTMLInputElement && target.id === SIDEBAR_FIELD_ID;

    const onPointerDown = (event: Event) => {
      if (!isSidebarField(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      show(event.target.value);
    };

    const swallow = (event: Event) => {
      if (!isSidebarField(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isSidebarField(event.target)) return;
      event.stopImmediatePropagation();
      const field = event.target;
      // Return focus where the keyboard user came from on close. With no
      // previous element, use the next control in the sidebar search (the tag
      // filter button), so focus lands somewhere usable that doesn't reopen.
      const from = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      const next = field.closest('[role="search"]')?.querySelector<HTMLElement>('button') ?? null;
      field.blur();
      show(field.value, from ?? next);
    };

    // Storybook re-renders the sidebar, so keep the placeholder in sync.
    const syncPlaceholder = () => {
      const field = document.getElementById(SIDEBAR_FIELD_ID);
      if (field instanceof HTMLInputElement && field.placeholder !== SIDEBAR_PLACEHOLDER) {
        field.placeholder = SIDEBAR_PLACEHOLDER;
      }
    };
    const observer = new MutationObserver(syncPlaceholder);
    observer.observe(document.body, { childList: true, subtree: true });
    syncPlaceholder();

    window.addEventListener('keydown', onKeyDown, { capture: true });
    document.addEventListener('focusin', onFocusIn, { capture: true });
    document.addEventListener('pointerdown', onPointerDown, { capture: true });
    document.addEventListener('mousedown', swallow, { capture: true });
    document.addEventListener('click', swallow, { capture: true });
    const channel = addons.getChannel();
    const openFromPreview = () => show();
    channel.on(SEARCH_OPEN, openFromPreview);
    // Warm the index so the first search is instant.
    const idle = window.setTimeout(() => getIndex().catch(() => {}), 2000);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      document.removeEventListener('focusin', onFocusIn, { capture: true });
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      document.removeEventListener('mousedown', swallow, { capture: true });
      document.removeEventListener('click', swallow, { capture: true });
      channel.off(SEARCH_OPEN, openFromPreview);
      window.clearTimeout(idle);
    };
  }, [show]);

  return state.open ? (
    <SearchDialog api={api} theme={theme} initialQuery={state.query} onClose={hide} />
  ) : null;
}

let mounted = false;

/**
 * Mounts the search outside Storybook's toolbar so it works on every page,
 * including ones that hide the toolbar.
 */
export function mountSearch(api: API, theme: StorybookTheme) {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;
  const container = document.createElement('div');
  container.id = 'apollo-storybook-search';
  document.body.appendChild(container);
  createRoot(container).render(<SearchHost api={api} theme={theme} />);
}

const STYLES = `
.apollo-search {
  position: fixed;
  inset: 0;
  z-index: 100000;
  font-family: var(--as-font);
  color: var(--as-text);
}
.apollo-search__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}
.apollo-search__panel {
  position: relative;
  margin: 10vh auto 0;
  width: min(680px, calc(100vw - 32px));
  max-height: 76vh;
  display: flex;
  flex-direction: column;
  background: var(--as-bg);
  border: 1px solid var(--as-border);
  border-radius: calc(var(--as-radius) * 2);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}
.apollo-search__field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--as-border);
}
.apollo-search__field svg { flex: none; color: var(--as-muted); }
.apollo-search__field input {
  flex: 1;
  min-width: 0;
  height: 52px;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 16px;
}
.apollo-search__field input::-webkit-search-cancel-button { display: none; }
.apollo-search kbd {
  font-family: var(--as-mono);
  font-size: 11px;
  padding: 1px 5px;
  border: 1px solid var(--as-border);
  border-radius: 4px;
  color: var(--as-muted);
  background: var(--as-bg-app);
}
.apollo-search__results {
  overflow-y: auto;
  padding: 6px 8px 10px;
  overscroll-behavior: contain;
}
.apollo-search [data-library="wind"] { --lib: var(--as-lib-wind); }
.apollo-search [data-library="react"] { --lib: var(--as-lib-react); }
.apollo-search [data-library="material"] { --lib: var(--as-lib-material); }
.apollo-search [data-library="core"] { --lib: var(--as-lib-core); }
.apollo-search [data-library="other"] { --lib: var(--as-lib-other); }
.apollo-search__library {
  position: sticky;
  top: -6px;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 10px -8px 4px;
  padding: 14px 16px 10px;
  background: var(--as-bg);
  border-top: 1px solid var(--as-border);
  border-bottom: 1px solid color-mix(in srgb, var(--lib) 25%, transparent);
}
.apollo-search__results > .apollo-search__library:first-child { margin-top: -6px; border-top: 0; }
.apollo-search__library-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--lib);
}
.apollo-search__library-note { font-size: 13px; color: var(--as-muted); }
.apollo-search__library[data-library="material"] .apollo-search__library-note { color: var(--lib); }
.apollo-search__badge {
  flex: none;
  align-self: center;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  color: var(--lib);
  border: 1px solid color-mix(in srgb, var(--lib) 45%, transparent);
  background: color-mix(in srgb, var(--lib) 12%, transparent);
  border-radius: 999px;
  white-space: nowrap;
}
.apollo-search__badge-flag {
  padding-left: 4px;
  border-left: 1px solid color-mix(in srgb, var(--lib) 45%, transparent);
  font-weight: 500;
}
.apollo-search__row[data-library] { box-shadow: inset 3px 0 0 transparent; }
.apollo-search__row[data-library][data-active] { box-shadow: inset 3px 0 0 var(--lib); }
.apollo-search__row--group[data-library] > svg { color: var(--lib); }
.apollo-search__row[data-library="material"] .apollo-search__title { opacity: 0.85; }
.apollo-search__section-label {
  padding: 12px 8px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--as-muted);
}
.apollo-search__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border-radius: var(--as-radius);
  cursor: pointer;
}
.apollo-search__row > svg { flex: none; margin-top: 2px; color: var(--as-muted); }
.apollo-search__row[data-active] { background: var(--as-hover); }
.apollo-search__row[data-active] > svg,
.apollo-search__row[data-active] .apollo-search__hash { color: var(--as-accent); }
.apollo-search__row--hit { padding-left: 32px; }
.apollo-search__hash {
  flex: none;
  width: 14px;
  text-align: center;
  color: var(--as-muted);
  font-family: var(--as-mono);
}
.apollo-search__row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.apollo-search__title { font-weight: 600; font-size: 14px; }
.apollo-search__label { font-size: 13px; font-weight: 500; }
.apollo-search__meta,
.apollo-search__snippet {
  font-size: 12px;
  line-height: 1.45;
  color: var(--as-muted);
}
.apollo-search__snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.apollo-search mark {
  background: transparent;
  color: var(--as-accent);
  font-weight: 700;
}
.apollo-search__empty {
  margin: 0;
  padding: 28px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--as-muted);
}
.apollo-search__footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--as-border);
  font-size: 12px;
  color: var(--as-muted);
  background: var(--as-bg-app);
}
.apollo-search__footer kbd { margin-right: 2px; }
.apollo-search__status { margin-left: auto; }
@media (max-width: 600px) {
  .apollo-search__panel { margin-top: 16px; max-height: calc(100vh - 32px); }
  .apollo-search__footer > span:not(.apollo-search__status) { display: none; }
}
`;
