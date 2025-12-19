import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ApChat as ReactApChat } from '@uipath/apollo-react/ap-chat';

import type { ApChatProperties } from './types';

// Singleton observer to watch document.head for all instances
let globalObserver: MutationObserver | null = null;
const containerCallbacks = new Map<ShadowRoot, (node: Node) => void>();

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
export function createReactRenderer(shadowRoot: ShadowRoot, container: HTMLElement) {
  // Create Emotion cache that injects into the Shadow DOM
  const emotionCache = createCache({
    key: 'ap-chat',
    container: shadowRoot,
    prepend: true,
  });

  // Also mirror styles from document.head to shadowRoot for compatibility
  const handleStyleNode = (node: Node) => {
    const clone = node.cloneNode(true) as HTMLStyleElement;
    shadowRoot.appendChild(clone);
  };

  containerCallbacks.set(shadowRoot, handleStyleNode);

  // Initialize the shared observer
  getOrCreateGlobalObserver();

  return function ReactRenderer(props: ApChatProperties) {
    const { chatServiceInstance, locale = 'en', theme = 'light' } = props;

    // Enable internal MUI ThemeProvider for web component usage
    // Pass container as portalContainer so portals render inside shadow DOM
    // Disable embedded portal - the web component wrapper handles positioning
    return (
        <CacheProvider value={emotionCache}>
          <ReactApChat
            chatServiceInstance={chatServiceInstance}
            locale={locale}
            theme={theme}
            portalContainer={container}
            enableInternalThemeProvider={true}
            disableEmbeddedPortal={true}
          />
        </CacheProvider>
    );
  };
}

/**
 * Cleanup function to unregister a container (call when web component disconnects)
 */
export function cleanupReactRenderer(shadowRoot: ShadowRoot) {
  containerCallbacks.delete(shadowRoot);

  // If no more containers, disconnect the global observer
  if (containerCallbacks.size === 0 && globalObserver) {
    globalObserver.disconnect();
    globalObserver = null;
  }
}
