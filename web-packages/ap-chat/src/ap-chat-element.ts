import { createElement } from 'react';

import {
  createRoot,
  type Root,
} from 'react-dom/client';

import {
  cleanupReactRenderer,
  createReactRenderer,
} from './react-renderer';
import {
  AutopilotChatEvent,
  type AutopilotChatService,
} from './service';
import type { ApChatProperties } from './types';

/**
 * ap-chat web component
 *
 * A framework-agnostic web component wrapper around the ApChat React component.
 * Provides a custom element API for use in any JavaScript framework or vanilla JS.
 *
 * @example
 * ```html
 * <script type="module">
 *   import { AutopilotChatService } from '@uipath/ap-chat/service';
 *   import '@uipath/ap-chat';
 *
 *   const service = new AutopilotChatService();
 *   service.initialize({ mode: 'side-by-side' });
 *
 *   const chat = document.querySelector('ap-chat');
 *   chat.chatServiceInstance = service;
 *   chat.locale = 'en';
 *   chat.theme = 'light';
 *
 *   service.open();
 * </script>
 *
 * <ap-chat></ap-chat>
 * ```
 */
export class ApChat extends HTMLElement {
  private root: Root | null = null;
  private ReactRenderer: ReturnType<typeof createReactRenderer> | null = null;
  private serviceUnsubscribe: (() => void) | null = null;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;
  private _initialized: boolean = false;
  private container: HTMLDivElement | null = null;
  private emotionContainer: HTMLElement | null = null;

  // Properties (not attributes - these are complex objects)
  private _chatServiceInstance: AutopilotChatService | null = null;
  private _locale: ApChatProperties['locale'] = 'en';
  private _theme: ApChatProperties['theme'] = 'light';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Gets the chat service instance
   */
  get chatServiceInstance(): AutopilotChatService | null {
    return this._chatServiceInstance;
  }

  /**
   * Sets the chat service instance and triggers a re-render
   */
  set chatServiceInstance(value: AutopilotChatService | null) {
    // Cleanup previous service subscription
    if (this.serviceUnsubscribe) {
      this.serviceUnsubscribe();
      this.serviceUnsubscribe = null;
    }

    this._chatServiceInstance = value;

    // Subscribe to config changes to handle embedded mode
    if (value) {
      this.serviceUnsubscribe = value.on(AutopilotChatEvent.ModeChange, () => {
        this.handleEmbeddedMode();
      });

      // Also handle initial embedded mode if already set
      this.handleEmbeddedMode();
    }

    this.render();
  }

  /**
   * Gets the current locale
   */
  get locale(): ApChatProperties['locale'] {
    return this._locale;
  }

  /**
   * Sets the locale and triggers a re-render
   */
  set locale(value: ApChatProperties['locale']) {
    this._locale = value;
    this.render();
  }

  /**
   * Gets the current theme
   */
  get theme(): ApChatProperties['theme'] {
    return this._theme;
  }

  /**
   * Sets the theme and triggers a re-render
   */
  set theme(value: ApChatProperties['theme']) {
    this._theme = value;
    this.render();
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    this.init();
  }

  /**
   * Called when the element is disconnected from the DOM
   */
  disconnectedCallback() {
    // Cleanup service subscription temporarily (will be re-subscribed on reconnect)
    if (this.serviceUnsubscribe) {
      this.serviceUnsubscribe();
      this.serviceUnsubscribe = null;
    }

    // Cleanup emotion observer callback (lightweight, can be re-registered on reconnect)
    if (this.emotionContainer) {
      cleanupReactRenderer(this.emotionContainer);
    }

    // Unmount React root to prevent memory leaks
    // Note: If element is just being moved (not removed), connectedCallback will recreate it
    if (this.root) {
      this.root.unmount();
      this.root = null;
      this.ReactRenderer = null;
    }
  }

  /**
   * Initializes the Shadow DOM and React root
   */
  private init() {
    if (!this.shadowRoot) return;

    // Prevent duplicate Shadow DOM initialization when element is moved between containers
    if (this._initialized) {
      // Re-subscribe to service events if needed
      if (this._chatServiceInstance && !this.serviceUnsubscribe) {
        this.serviceUnsubscribe = this._chatServiceInstance.on(AutopilotChatEvent.ModeChange, () => {
          this.handleEmbeddedMode();
        });
      }

      // Recreate React root if it was cleaned up (happens when element is moved)
      if (!this.root && this.container && this.emotionContainer) {
        this.root = createRoot(this.container);
        this.ReactRenderer = createReactRenderer(this.emotionContainer);
      }

      // Re-render with current props if already initialized
      this.render();
      return;
    }

    this._initialized = true;

    // Inject Apollo CSS into Shadow DOM
    // Get Apollo CSS from document
    const apolloCssLinks = Array.from(document.querySelectorAll('link[href*="apollo-core"]'));
    apolloCssLinks.forEach(link => {
      const clonedLink = link.cloneNode(true) as HTMLLinkElement;
      this.shadowRoot!.appendChild(clonedLink);
    });

    // Copy @font-face rules from parent document to Shadow DOM using adoptedStyleSheets
    const fontFaceRules: string[] = [];
    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            fontFaceRules.push(rule.cssText);
          }
        });
      } catch (e) {
        // CORS or other access issues - skip this stylesheet
      }
    });

    // Material Icons CSS classes
    const iconStylesText = `
      .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
      }

      .material-icons-outlined {
        font-family: 'Material Icons Outlined';
        font-weight: normal;
        font-style: normal;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
      }
    `;

    // Create a constructable stylesheet for Shadow DOM
    const shadowStyleSheet = new CSSStyleSheet();
    const allStyles = [...fontFaceRules, iconStylesText].join('\n');
    shadowStyleSheet.replaceSync(allStyles);
    this.shadowRoot.adoptedStyleSheets = [shadowStyleSheet];

    // Host styles
    const hostStyles = document.createElement('style');
    hostStyles.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;
    this.shadowRoot.appendChild(hostStyles);

    // Create Emotion style container at the top of Shadow DOM
    this.emotionContainer = document.createElement('div');
    this.emotionContainer.id = 'emotion-container';
    this.shadowRoot.appendChild(this.emotionContainer);

    // Create container for React
    this.container = document.createElement('div');
    this.container.className = this._theme || 'light';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.shadowRoot.appendChild(this.container);

    // Create React root with Shadow DOM, passing emotion container
    this.root = createRoot(this.container);
    this.ReactRenderer = createReactRenderer(this.emotionContainer);

    // Initial render
    this.render();
  }

  /**
   * Handles embedded mode by moving the web component into the embedded container
   */
  private handleEmbeddedMode() {
    if (!this._chatServiceInstance) {
      return;
    }

    const config = this._chatServiceInstance.getConfig();
    const embeddedContainer = config?.embeddedContainer;
    const isEmbeddedMode = config?.mode === 'embedded';

    if (embeddedContainer && isEmbeddedMode && this.parentElement !== embeddedContainer) {
      // Moving into embedded mode
      // Save original position
      if (!this.originalParent) {
        this.originalParent = this.parentElement;
        this.originalNextSibling = this.nextSibling;
      }

      // Move this web component into the embedded container
      embeddedContainer.appendChild(this);

      // Set size to fill container
      this.style.width = '100%';
      this.style.height = '100%';
    } else if (!isEmbeddedMode && this.originalParent) {
      // Moving out of embedded mode - restore original position
      if (this.originalNextSibling && this.originalNextSibling.parentNode) {
        this.originalParent.insertBefore(this, this.originalNextSibling);
      } else {
        this.originalParent.appendChild(this);
      }

      // Clear size overrides
      this.style.width = '';
      this.style.height = '';

      // Clear original position references
      this.originalParent = null;
      this.originalNextSibling = null;
    }
  }

  /**
   * Renders the React component with current properties
   */
  private render() {
    if (!this.root || !this.ReactRenderer || !this._chatServiceInstance) {
      return;
    }
    // Update container theme class
    if (this.container) {
      this.container.className = this._theme || 'light';
    }

    const props: ApChatProperties = {
      chatServiceInstance: this._chatServiceInstance,
      locale: this._locale,
      theme: this._theme,
    };

    this.root.render(createElement(this.ReactRenderer, props));
  }
}

// Auto-register the custom element
if (!customElements.get('ap-chat')) {
  customElements.define('ap-chat', ApChat);
}
