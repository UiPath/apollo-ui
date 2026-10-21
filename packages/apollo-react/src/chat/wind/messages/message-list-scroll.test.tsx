import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ApChat,
  AutopilotChatEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatRole,
  AutopilotChatService,
} from '../../index';

// A layout model in the style of the MessageScroller primitive's own tests: every scroller row is
// ROW px tall, the viewport is VIEWPORT px, and the tail spacer takes the height the primitive
// writes on it.
const ROW = 100;
const VIEWPORT = 300;

const isViewport = (element: Element) =>
  (element as HTMLElement).dataset?.slot === 'message-scroller-viewport';
const isContent = (element: Element) =>
  (element as HTMLElement).dataset?.slot === 'message-scroller-content';
const viewportOf = (element: Element) =>
  element.closest('[data-slot="message-scroller-viewport"]') as HTMLElement | null;

function rows(content: Element) {
  return [...content.children] as HTMLElement[];
}

function rowHeight(row: HTMLElement) {
  if (row.hasAttribute('data-message-scroller-spacer')) {
    return row.hidden ? 0 : Number.parseFloat(row.style.height || '0') || 0;
  }
  return ROW;
}

function contentHeight(content: Element) {
  return rows(content).reduce((sum, row) => sum + rowHeight(row), 0);
}

let originalRect: typeof HTMLElement.prototype.getBoundingClientRect;
let originalScrollTo: typeof HTMLElement.prototype.scrollTo;
const resizeCallbacks = new Set<ResizeObserverCallback>();

beforeEach(() => {
  originalRect = HTMLElement.prototype.getBoundingClientRect;
  originalScrollTo = HTMLElement.prototype.scrollTo;
  window.ResizeObserver = class {
    constructor(private callback: ResizeObserverCallback) {
      resizeCallbacks.add(callback);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      resizeCallbacks.delete(this.callback);
    }
  } as unknown as typeof ResizeObserver;

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return isViewport(this) ? VIEWPORT : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      if (isViewport(this)) {
        const content = this.querySelector('[data-slot="message-scroller-content"]');
        return content ? contentHeight(content) : 0;
      }
      return isContent(this) ? contentHeight(this) : 0;
    },
  });
  HTMLElement.prototype.scrollTo = function scrollTo(
    options?: ScrollToOptions | number,
    y?: number
  ) {
    const top = typeof options === 'number' ? y : options?.top;
    if (typeof top === 'number') {
      const max = Math.max(0, this.scrollHeight - this.clientHeight);
      this.scrollTop = Math.min(max, Math.max(0, top));
      this.dispatchEvent(new Event('scroll'));
    }
  };
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    if (isViewport(this)) {
      return DOMRect.fromRect({ x: 0, y: 0, width: 400, height: VIEWPORT });
    }
    const parent = this.parentElement;
    if (parent && isContent(parent)) {
      const viewport = viewportOf(parent);
      const index = rows(parent).indexOf(this);
      const top = rows(parent)
        .slice(0, index)
        .reduce((sum, row) => sum + rowHeight(row), 0);
      return DOMRect.fromRect({
        x: 0,
        y: top - (viewport?.scrollTop ?? 0),
        width: 400,
        height: rowHeight(this),
      });
    }
    return originalRect.call(this);
  };
});

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  HTMLElement.prototype.scrollTo = originalScrollTo;
  resizeCallbacks.clear();
});

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

// Lets the primitive's observers and frames run: mutation callbacks are microtasks, resize
// handling is coalesced into a frame. Waits on frames, not wall time, so a busy runner cannot
// cut the chain short.
async function settle() {
  await act(async () => {
    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
    for (let frame = 0; frame < 4; frame++) await nextFrame();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

let instanceCounter = 0;

function setup({ paginatedMessages = false, compactMode = false } = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-scroll-model-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer: 'wind',
      paginatedMessages,
      spacing: { compactMode },
    },
  });
  // Six one-message groups (no groupId): a transcript taller than the viewport.
  service.setConversation(
    Array.from({ length: 6 }, (_, index) => ({
      id: `m${index}`,
      content: `message ${index}`,
      created_at: '',
      role: index % 2 === 0 ? AutopilotChatRole.User : AutopilotChatRole.Assistant,
      widget: 'apollo-markdown-renderer',
    }))
  );
  render(<ApChat chatServiceInstance={service} />);
  const viewport = () =>
    document.querySelector('[data-slot="message-scroller-viewport"]') as HTMLElement;
  const maxTop = () => viewport().scrollHeight - viewport().clientHeight;
  const reply = (extra: Partial<AutopilotChatMessage>) =>
    service.sendResponse({ widget: 'apollo-markdown-renderer', created_at: '', ...extra });

  return { service, viewport, maxTop, reply };
}

describe('Wind message list scrolling', () => {
  it('opens at the end and follows appended replies', async () => {
    const { viewport, maxTop, reply } = setup();
    await settle();
    expect(viewport().scrollTop).toBe(maxTop());

    act(() => reply({ id: 'r1', content: 'one more' }));
    await settle();

    expect(viewport().scrollTop).toBe(maxTop());
  });

  it('holds a new turn with a 12px peek, then never jumps back to an earlier one', async () => {
    const { service, viewport, reply } = setup();
    await settle();

    await act(async () => {
      service.sendRequest({ content: 'new question' });
    });
    await settle();
    const anchored = viewport().scrollTop;
    // Six rows before the new turn, minus Wind's 12px peek (the primitive's default is 64). The
    // model has no CSS, so the list's 12px top padding is 0 here: this proves the peek reaches
    // the scroller, not the 24px landing, which is measured in the playground.
    expect(anchored).toBe(6 * ROW - 12);

    // The reply arrives while the loading row goes away: the scroller must not mistake that for
    // a new, earlier turn (it used to scroll to the first user message).
    act(() => reply({ id: 'r2', content: 'answer' }));
    await settle();

    expect(viewport().scrollTop).toBeGreaterThanOrEqual(anchored);
  });

  it("lands a new turn at the list padding in compact, clear of the previous reply's actions", async () => {
    const { service, viewport } = setup({ compactMode: true });
    await settle();

    await act(async () => {
      service.sendRequest({ content: 'new question' });
    });
    await settle();

    // No peek in compact (the model has no CSS padding, see above).
    expect(viewport().scrollTop).toBe(6 * ROW);
  });

  it('holds the anchor through a short streamed reply, which the tail spacer makes reachable', async () => {
    const { service, viewport, reply } = setup();
    await settle();
    await act(async () => {
      service.sendRequest({ content: 'short question' });
    });
    await settle();
    const anchored = viewport().scrollTop;
    // The 12px peek; the model has no CSS padding (see above).
    expect(anchored).toBe(6 * ROW - 12);

    for (const content of ['A', ' short', ' reply.']) {
      act(() => reply({ id: 'r3', content, stream: true }));
      await settle();
      expect(viewport().scrollTop).toBe(anchored);
    }
    act(() => reply({ id: 'r3', content: '', stream: true, done: true }));
    await settle();

    expect(viewport().scrollTop).toBe(anchored);
    // The rows after the anchor are shorter than the viewport; the spacer covers the rest.
    const spacer = viewport().querySelector('[data-message-scroller-spacer]') as HTMLElement;
    const afterAnchor =
      viewport().scrollHeight - anchored - Number.parseFloat(spacer.style.height || '0');
    expect(afterAnchor).toBeLessThan(VIEWPORT);
    expect(viewport().scrollHeight - anchored).toBeGreaterThanOrEqual(VIEWPORT);
  });

  it('stays put after the reader scrolls away, and the jump button re-arms following', async () => {
    const { viewport, maxTop, reply } = setup();
    await settle();

    act(() => {
      viewport().dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true }));
      viewport().scrollTop = 50;
      viewport().dispatchEvent(new Event('scroll'));
    });
    await settle();

    act(() => reply({ id: 'r3', content: 'while away' }));
    await settle();
    expect(viewport().scrollTop).toBe(50);

    act(() =>
      (document.querySelector('[data-slot="message-scroller-button"]') as HTMLButtonElement).click()
    );
    await settle();
    act(() => reply({ id: 'r4', content: 'after re-arm' }));
    await settle();

    expect(viewport().scrollTop).toBe(maxTop());
  });

  it('keeps every scroller row a message group while loading states come and go', async () => {
    const { service } = setup();
    await settle();
    const content = document.querySelector('[data-slot="message-scroller-content"]') as HTMLElement;
    const groupRows = () =>
      rows(content).filter((row) => !row.hasAttribute('data-message-scroller-spacer'));

    await act(async () => {
      service.sendRequest({ content: 'question' });
    });

    expect(groupRows().every((row) => row.dataset.slot === 'wind-chat-message-group')).toBe(true);
    expect(document.querySelector('[data-slot="wind-chat-thinking"]')).not.toBeNull();
  });

  it('keeps the reading position when older messages are prepended at the top', async () => {
    const { service, viewport, maxTop } = setup({ paginatedMessages: true });
    const older = Array.from({ length: 3 }, (_, index) => ({
      id: `older${index}`,
      content: `older ${index}`,
      created_at: '',
      role: AutopilotChatRole.Assistant,
      widget: 'apollo-markdown-renderer',
    }));
    service.on(AutopilotChatEvent.ConversationLoadMore, () =>
      service.prependOlderMessages(older, true)
    );
    await settle();

    act(() => {
      viewport().dispatchEvent(new WheelEvent('wheel', { deltaY: -600, bubbles: true }));
      viewport().scrollTop = 0;
      viewport().dispatchEvent(new Event('scroll'));
    });
    await settle();
    await settle();

    expect(service.getConversation()[0]?.id).toBe('older0');
    // The three new rows sit above the row that was at the top, which stays in view.
    expect(viewport().scrollTop).toBe(3 * ROW);
    expect(viewport().scrollTop).not.toBe(0);
    expect(viewport().scrollTop).not.toBe(maxTop());
  });
});
