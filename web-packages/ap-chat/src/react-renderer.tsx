import { createElement } from 'react';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ApChat as ReactApChat } from '@uipath/apollo-react/ap-chat';

import type { ApChatProperties } from './types';

// Singleton observer to watch document.head for all instances
let globalObserver: MutationObserver | null = null;
const containerCallbacks = new Map<HTMLElement, (node: Node) => void>();

function getOrCreateGlobalObserver() {
  if (!globalObserver) {
    globalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'STYLE' && (node as HTMLStyleElement).getAttribute('data-emotion')) {
            // Notify all registered containers
            containerCallbacks.forEach((callback) => {
              callback(node);
            });
          }
        });
      });
    });

    globalObserver.observe(document.head, {
      childList: true,
    });
  }
  return globalObserver;
}

/**
 * Creates a React renderer function with Shadow DOM support.
 * Uses a shared MutationObserver to efficiently mirror Emotion styles.
 */
export function createReactRenderer(emotionContainer: HTMLElement) {
  // Create Emotion cache with default behavior (injects to document head)
  const emotionCache = createCache({
    key: 'ap-chat',
  });

  // Register callback for this container
  const handleStyleNode = (node: Node) => {
    const clone = node.cloneNode(true) as HTMLStyleElement;
    emotionContainer.appendChild(clone);
  };

  containerCallbacks.set(emotionContainer, handleStyleNode);

  // Initialize the shared observer
  getOrCreateGlobalObserver();

  return function ReactRenderer(props: ApChatProperties) {
    const { chatServiceInstance, locale = 'en', theme = 'light' } = props;

    return createElement(
      CacheProvider,
      { value: emotionCache },
      createElement(ReactApChat, {
        chatServiceInstance,
        locale,
        theme,
      })
    );
  };
}

/**
 * Cleanup function to unregister a container (call when web component disconnects)
 */
export function cleanupReactRenderer(emotionContainer: HTMLElement) {
  containerCallbacks.delete(emotionContainer);

  // If no more containers, disconnect the global observer
  if (containerCallbacks.size === 0 && globalObserver) {
    globalObserver.disconnect();
    globalObserver = null;
  }
}
