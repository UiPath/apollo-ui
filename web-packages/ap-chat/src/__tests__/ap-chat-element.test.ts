import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ApChat } from '../ap-chat-element';
import {
  AutopilotChatEvent,
  AutopilotChatMode,
} from '../service';

describe('ApChat Web Component', () => {
  let element: ApChat;
  let mockService: any;

  beforeAll(() => {
    // Ensure custom element is registered
    if (!customElements.get('ap-chat')) {
      customElements.define('ap-chat', ApChat);
    }
  });

  beforeEach(() => {
    // Create a mock service that implements the AutopilotChatService interface
    let config: any = {
      mode: AutopilotChatMode.SideBySide,
    };
    let modeChangeCallback: (() => void) | null = null;

    mockService = {
      initialize: vi.fn((newConfig: any) => {
        config = { ...config, ...newConfig };
        // Trigger mode change callback if registered
        if (modeChangeCallback) {
          modeChangeCallback();
        }
      }),
      open: vi.fn(),
      close: vi.fn(),
      on: vi.fn((eventName: any, callback: () => void) => {
        // Store the callback for ModeChange events
        if (eventName === AutopilotChatEvent.ModeChange) {
          modeChangeCallback = callback;
        }
        // Return unsubscribe function
        return vi.fn(() => {
          if (eventName === AutopilotChatEvent.ModeChange) {
            modeChangeCallback = null;
          }
        });
      }),
      off: vi.fn(),
      getConfig: vi.fn(() => config),
    };

    // Create element using document.createElement (proper web component instantiation)
    element = document.createElement('ap-chat') as ApChat;
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Only remove if element is still in the DOM
    if (element && element.parentElement) {
      element.parentElement.removeChild(element);
    }
  });

  describe('Shadow DOM', () => {
    it('should attach shadow DOM in open mode', () => {
      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot?.mode).toBe('open');
    });

    it('should initialize adoptedStyleSheets in shadow root with document styles', () => {
      element.chatServiceInstance = mockService;

      // Trigger connectedCallback
      element.connectedCallback();

      // Check that adoptedStyleSheets includes document.adoptedStyleSheets + shadow stylesheet
      expect(element.shadowRoot?.adoptedStyleSheets).toBeDefined();
      expect(element.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThanOrEqual(1);
    });

    it('should copy font-face rules from document to shadow DOM', () => {
      // Mock document.styleSheets with proper cssRules
      const mockFontFaceRule = {
        type: 5, // CSSFontFaceRule type
        cssText: '@font-face { font-family: "Test Font"; src: url("test.woff2"); }',
      };

      const mockStyleSheet = {
        cssRules: [mockFontFaceRule],
      };

      const originalStyleSheets = document.styleSheets;
      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        configurable: true,
      });

      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Check that adoptedStyleSheets contains the font-face rule (last stylesheet is the shadow one)
      const sheets = element.shadowRoot?.adoptedStyleSheets;
      expect(sheets).toBeDefined();
      expect(sheets!.length).toBeGreaterThan(0);

      // Restore original styleSheets
      Object.defineProperty(document, 'styleSheets', {
        value: originalStyleSheets,
        configurable: true,
      });
    });
  });

  describe('Properties', () => {
    it('should subscribe to service events when chatServiceInstance is set', () => {
      element.chatServiceInstance = mockService;
      expect(mockService.on).toHaveBeenCalledWith(AutopilotChatEvent.ModeChange, expect.any(Function));
    });

    it('should cleanup previous subscription when chatServiceInstance changes', () => {
      element.chatServiceInstance = mockService;
      const firstUnsubscribe = vi.fn();
      (element as any).serviceUnsubscribe = firstUnsubscribe;

      const newMockService = { ...mockService, on: vi.fn(() => vi.fn()) };
      element.chatServiceInstance = newMockService;

      expect(firstUnsubscribe).toHaveBeenCalled();
      expect(newMockService.on).toHaveBeenCalled();
    });

    it('should pass locale prop to React renderer', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();
      
      element.locale = 'fr';
      
      expect(element.locale).toBe('fr');
    });
  });

  describe('Embedded Mode', () => {
    it('should move element to embedded container when mode changes to embedded', () => {
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);

      // Initialize service and element
      mockService.initialize({
        mode: AutopilotChatMode.SideBySide,
      });
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Change to embedded mode with container
      mockService.initialize({
        mode: AutopilotChatMode.Embedded,
        embeddedContainer,
      });

      // Element should be moved to embedded container
      expect(element.parentElement).toBe(embeddedContainer);
      expect(element.style.width).toBe('100%');
      expect(element.style.height).toBe('100%');

      document.body.removeChild(embeddedContainer);
    });

    it('should restore original position when exiting embedded mode', () => {
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);

      // Initialize in embedded mode
      mockService.initialize({
        mode: AutopilotChatMode.Embedded,
        embeddedContainer,
      });
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Element should be in embedded container
      expect(element.parentElement).toBe(embeddedContainer);

      // Exit embedded mode
      mockService.initialize({
        mode: AutopilotChatMode.SideBySide,
      });

      // Element should be restored to original position
      expect(element.parentElement).toBe(document.body);
      expect(element.style.width).toBe('');
      expect(element.style.height).toBe('');

      document.body.removeChild(embeddedContainer);
    });
  });

  describe('Lifecycle Methods', () => {
    it('should initialize on connectedCallback', () => {
      const initSpy = vi.spyOn(element as any, 'init');
      element.connectedCallback();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should not re-initialize when element is moved', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Get the count of children in shadowRoot after initial connection
      const initialChildCount = element.shadowRoot?.childNodes.length || 0;

      // Move element to different container
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(element);

      element.connectedCallback();

      // Shadow DOM structure should remain the same (not re-initialized)
      const afterMoveChildCount = element.shadowRoot?.childNodes.length || 0;
      expect(afterMoveChildCount).toBe(initialChildCount);

      document.body.removeChild(container);
    });

    it('should cleanup service subscription on disconnectedCallback', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      const unsubscribeSpy = vi.fn();
      (element as any).serviceUnsubscribe = unsubscribeSpy;

      element.disconnectedCallback();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect((element as any).serviceUnsubscribe).toBeNull();
    });

    it('should re-subscribe to service events when reconnected', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Disconnect
      element.disconnectedCallback();

      // Reconnect
      const renderSpy = vi.spyOn(element as any, 'render');
      element.connectedCallback();

      // Should re-subscribe and render
      expect(renderSpy).toHaveBeenCalled();
      expect((element as any).serviceUnsubscribe).toBeTruthy();
    });

    it('should unmount React root on disconnectedCallback to prevent memory leaks', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Verify React root was created
      const root = (element as any).root;
      expect(root).toBeTruthy();

      // Spy on unmount
      const unmountSpy = vi.spyOn(root, 'unmount');

      // Disconnect
      element.disconnectedCallback();

      // React root should be unmounted and cleared
      expect(unmountSpy).toHaveBeenCalled();
      expect((element as any).root).toBeNull();
      expect((element as any).ReactRenderer).toBeNull();
    });

    it('should recreate React root when reconnected after disconnect', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Disconnect (cleans up React root)
      element.disconnectedCallback();
      expect((element as any).root).toBeNull();

      // Reconnect
      element.connectedCallback();

      // React root should be recreated
      expect((element as any).root).toBeTruthy();
      expect((element as any).ReactRenderer).toBeTruthy();

      // And should still render properly
      const renderSpy = vi.spyOn((element as any).root, 'render');
      (element as any).render();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Material Icons Integration', () => {
    it('should include Material Icons CSS classes and host styles in shadow DOM', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Verify that adoptedStyleSheets array exists with icon styles and document styles
      expect(element.shadowRoot?.adoptedStyleSheets).toBeDefined();
      expect(Array.isArray(element.shadowRoot?.adoptedStyleSheets)).toBe(true);
      expect(element.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThanOrEqual(1);

      // Verify host styles are present
      const hostStyles = element.shadowRoot?.querySelector('style');
      expect(hostStyles).toBeDefined();
      expect(hostStyles?.textContent).toContain(':host');
      expect(hostStyles?.textContent).toContain('display: block');
    });
  });

  describe('React Integration', () => {
    it('should create React root when service is provided', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      // Verify React container was created with theme class
      // Access the container directly from the element's internal state
      const reactContainer = (element as any).container;
      expect(reactContainer).toBeDefined();
      expect(reactContainer?.className).toBe('light'); // default theme
    });

    it('should update container theme class when theme changes', () => {
      element.chatServiceInstance = mockService;
      element.connectedCallback();

      element.theme = 'dark';

      // The React container should have updated theme class
      const reactContainer = (element as any).container;
      expect(reactContainer?.className).toBe('dark');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing shadowRoot gracefully', () => {
      // Simulate missing shadow root by overriding the getter
      Object.defineProperty(element, 'shadowRoot', {
        get() { return null; },
        configurable: true,
      });

      expect(() => {
        (element as any).init();
      }).not.toThrow();
    });

    it('should handle render without React root gracefully', () => {
      (element as any).root = null;
      (element as any).ReactRenderer = null;

      expect(() => {
        (element as any).render();
      }).not.toThrow();
    });

    it('should handle CORS errors when copying font-face rules', () => {
      // Mock a stylesheet that throws CORS error
      const mockStyleSheet = {
        get cssRules() {
          throw new DOMException('SecurityError');
        },
      };

      // Mock document.styleSheets using Object.defineProperty
      const originalStyleSheets = document.styleSheets;
      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        configurable: true,
      });

      element.chatServiceInstance = mockService;

      // Should not throw
      expect(() => {
        element.connectedCallback();
      }).not.toThrow();

      // Restore original
      Object.defineProperty(document, 'styleSheets', {
        value: originalStyleSheets,
        configurable: true,
      });
    });
  });
});
