import React from 'react';

import type { AutopilotChatService } from '../../service';
import { useChatService } from '../providers/chat-service.provider';

interface WelcomeSlot {
  container: HTMLElement;
  /** Mounted places for the container, oldest first; it is one element, so the latest holds it. */
  hosts: HTMLElement[];
  rendered: boolean;
  cleanup?: () => void;
}

// One per service rather than per component: the first-run experience unmounts between displays
// and moves between layouts, and the host renders into this element (CAS mounts a React root),
// so it must not change identity.
const slots = new WeakMap<AutopilotChatService, WelcomeSlot>();

function slotFor(chatService: AutopilotChatService) {
  let slot = slots.get(chatService);
  if (!slot) {
    const container = document.createElement('div');
    container.dataset.slot = 'chat-welcome-content';
    slot = { container, hosts: [], rendered: false };
    slots.set(chatService, slot);
  }
  return slot;
}

function show(chatService: AutopilotChatService, slot: WelcomeSlot) {
  // Read here, not from state: a host passing a new function with every patch renders once.
  const welcomeContent = chatService.getConfig().welcomeContent;
  if (slot.rendered || !welcomeContent) {
    return;
  }
  slot.rendered = true;

  try {
    const cleanup = welcomeContent(slot.container);
    slot.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
  } catch {
    // A failing host renderer leaves the slot empty rather than breaking the chat.
    slot.container.replaceChildren();
  }
}

function hide(slot: WelcomeSlot) {
  if (!slot.rendered) {
    return;
  }
  slot.rendered = false;
  const cleanup = slot.cleanup;
  slot.cleanup = undefined;

  try {
    cleanup?.();
  } catch {
    // As above; the container is emptied either way.
  }
  slot.container.replaceChildren();
}

/**
 * Places the host's `welcomeContent` container in `host` while `host` is mounted, which a
 * renderer does while its first-run experience shows. The host callback gets the container once
 * per display; when the last place showing it unmounts, the callback's cleanup runs and the
 * container is emptied, to be handed over again on the next display. A place that unmounts while
 * another mounts in the same commit (a layout switch, a remount of the chat) moves the container
 * with its content instead.
 */
export function useWelcomeContent(host: React.RefObject<HTMLElement | null>) {
  const chatService = useChatService();

  React.useEffect(() => {
    const element = host.current;
    if (!element) {
      return;
    }

    const slot = slotFor(chatService);
    slot.hosts.push(element);
    element.appendChild(slot.container);
    show(chatService, slot);

    return () => {
      slot.hosts.splice(slot.hosts.indexOf(element), 1);
      // Two chats on one service: the one that stays takes the container back.
      const latest = slot.hosts[slot.hosts.length - 1];
      if (latest && slot.container.parentElement !== latest) {
        latest.appendChild(slot.container);
      }
      // After the commit: a place mounting in it keeps the content, and the host's cleanup may
      // unmount a React root, which React refuses while it is committing.
      queueMicrotask(() => {
        if (slot.hosts.length === 0) {
          hide(slot);
        }
      });
    };
  }, [chatService, host]);
}
