/**
 * Preview side of the Storybook search.
 *
 * - Forwards Cmd/Ctrl+K to the manager when focus is inside the preview, so
 *   the shortcut opens the search instead of Storybook's sidebar filter.
 * - Scrolls to the heading a search result points at once its page renders.
 */
import { addons } from 'storybook/preview-api';
import { type ScrollToPayload, SEARCH_OPEN, SEARCH_SCROLL_TO } from './events';

const WAIT_FOR_TARGET_MS = 8000;

function normalize(text: string | null | undefined) {
  return (text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function currentEntryId() {
  return new URLSearchParams(window.location.search).get('id');
}

function isRendering() {
  const { classList } = document.body;
  return (
    classList.contains('sb-show-preparing-story') || classList.contains('sb-show-preparing-docs')
  );
}

function findTarget({ anchor, heading }: ScrollToPayload): HTMLElement | null {
  if (anchor) {
    const byId = document.getElementById(anchor);
    if (byId) return byId;
  }
  const wanted = normalize(heading);
  if (!wanted) return null;
  const headings = document.querySelectorAll<HTMLElement>(
    '#storybook-docs h1, #storybook-docs h2, #storybook-docs h3, #storybook-docs h4, #storybook-root h1, #storybook-root h2, #storybook-root h3, #storybook-root h4'
  );
  for (const el of headings) {
    if (normalize(el.textContent) === wanted) return el;
  }
  return null;
}

/*
 * Documentation tab sets opt in with markers (see apps/storybook/scripts):
 * data-search-tabs on the set, data-search-tab="Label" on each tab button with
 * data-state="active" when open, and data-search-panel on the open panel.
 */

function tabLabel(trigger: HTMLElement) {
  return normalize(trigger.getAttribute('data-search-tab') || trigger.textContent);
}

function isOpen(trigger: HTMLElement) {
  return trigger.getAttribute('data-state') === 'active';
}

function openPanelOf(trigger: HTMLElement): HTMLElement | null {
  const set = trigger.closest<HTMLElement>('[data-search-tabs]');
  if (!set) return null;
  for (const panel of set.querySelectorAll<HTMLElement>('[data-search-panel]')) {
    // Radix keeps an empty, hidden element for every closed tab, skip those.
    const open = !panel.hidden && panel.getAttribute('data-state') !== 'inactive';
    if (open && panel.closest('[data-search-tabs]') === set) return panel;
  }
  return null;
}

/**
 * Finds the tab for each label in order, each one inside the open panel of the
 * one before. Stops at the first tab that is missing or not open yet.
 */
function findTabPath(labels: string[]): HTMLElement[] {
  const triggers: HTMLElement[] = [];
  let scope: ParentNode = document;
  for (const label of labels) {
    const wanted = normalize(label);
    const trigger = [...scope.querySelectorAll<HTMLElement>('[data-search-tab]')].find(
      (el) => tabLabel(el) === wanted
    );
    if (!trigger) break;
    triggers.push(trigger);
    const panel = isOpen(trigger) ? openPanelOf(trigger) : null;
    if (!panel) break;
    scope = panel;
  }
  return triggers;
}

/**
 * Radix tabs activate on mousedown (and on focus), hand-built tab buttons on
 * click. Try each until the tab reports itself open. A click after Radix has
 * already switched is harmless.
 */
function openTab(trigger: HTMLElement) {
  if (isOpen(trigger)) return;
  trigger.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })
  );
  if (!isOpen(trigger)) trigger.focus();
  if (!isOpen(trigger)) trigger.click();
}

function flash(el: HTMLElement) {
  el.animate(
    [
      { outline: '2px solid var(--color-primary, #0067df)', outlineOffset: '4px' },
      { outline: '2px solid transparent', outlineOffset: '4px' },
    ],
    { duration: 1600, easing: 'ease-out' }
  );
}

let pending: { payload: ScrollToPayload; stop: () => void } | null = null;

function scrollWhenReady(payload: ScrollToPayload) {
  pending?.stop();
  const startedAt = Date.now();
  let timer = 0;
  // When the tab was opened by this request, give React time to mount its panel.
  let tabOpenedAt = 0;
  const PANEL_GRACE_MS = 1200;

  const attempt = () => {
    if (Date.now() - startedAt > WAIT_FOR_TARGET_MS) {
      stop();
      return;
    }
    if (currentEntryId() === payload.entryId && !isRendering()) {
      let target: HTMLElement | null;
      const tabs = payload.tabs ?? [];
      if (tabs.length > 0) {
        const path = findTabPath(tabs);
        const trigger = path[path.length - 1] ?? null;
        // Open the path one tab at a time, letting each panel mount before the next.
        if (trigger && !isOpen(trigger)) {
          openTab(trigger);
          tabOpenedAt = Date.now();
          timer = window.setTimeout(attempt, 120);
          return;
        }
        // The next tab in the path hasn't rendered yet. Wait, then fall back to
        // the heading or the deepest tab found.
        if (path.length < tabs.length && Date.now() - startedAt < WAIT_FOR_TARGET_MS / 2) {
          timer = window.setTimeout(attempt, 120);
          return;
        }
        const heading = findTarget(payload);
        const set = trigger?.closest<HTMLElement>('[data-search-tabs]');
        const inPanel = Boolean(heading && set?.contains(heading));
        // The panel may still be mounting, keep looking for its heading for a moment.
        if (trigger && !inPanel && tabOpenedAt && Date.now() - tabOpenedAt < PANEL_GRACE_MS) {
          timer = window.setTimeout(attempt, 120);
          return;
        }
        // A heading inside the panel is the best target. Otherwise the match is
        // panel text under a heading above the tabs, so show the open tab.
        target = inPanel ? heading : (trigger ?? heading);
      } else {
        target = findTarget(payload);
      }
      if (target) {
        stop();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        flash(target);
        return;
      }
    }
    timer = window.setTimeout(attempt, 120);
  };

  const stop = () => {
    window.clearTimeout(timer);
    if (pending?.payload === payload) pending = null;
  };

  pending = { payload, stop };
  attempt();
}

let installed = false;

export function installSearchPreviewBridge() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const channel = addons.getChannel();

  channel.on(SEARCH_SCROLL_TO, (payload: ScrollToPayload) => scrollWhenReady(payload));

  window.addEventListener(
    'keydown',
    (event) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopImmediatePropagation();
        channel.emit(SEARCH_OPEN);
      }
    },
    { capture: true }
  );
}
