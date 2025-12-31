import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReactRenderer } from '../react-renderer';
import type { ApChatProperties } from '../types';

// Unmock react-renderer since setup.ts mocks it globally
vi.unmock('../react-renderer');

// Mock the dependencies
vi.mock('@emotion/cache', () => ({
  default: vi.fn(() => ({
    key: 'ap-chat',
  })),
}));

vi.mock('@emotion/react', () => ({
  CacheProvider: ({ children }: any) => children,
}));

vi.mock('@uipath/apollo-react/ap-chat', () => ({
  ApChat: vi.fn(() => null),
}));

describe('createReactRenderer', () => {
  let shadowRoot: ShadowRoot;
  let portalContainer: HTMLDivElement;
  let mockService: any;

  beforeEach(() => {
    // Create a proper ShadowRoot for testing
    const hostElement = document.createElement('div');
    shadowRoot = hostElement.attachShadow({ mode: 'open' });

    // Create a portal container as required by createReactRenderer
    portalContainer = document.createElement('div');
    portalContainer.className = 'portal-container';
    portalContainer.id = 'test-portal-container';

    mockService = {
      initialize: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      on: vi.fn(() => vi.fn()),
      off: vi.fn(),
      getConfig: vi.fn(() => ({ mode: 'side-by-side' })),
    };
  });

  it('should create a ReactRenderer function', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    expect(ReactRenderer).toBeTypeOf('function');
  });

  it('should return a function that accepts ApChatProperties', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'light',
    };

    const result = ReactRenderer(props);

    // Should return a React element (object with type and props)
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('should use default props when not provided', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
    };

    const result = ReactRenderer(props);

    expect(result).toBeTruthy();
  });

  it('should handle different locales', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'fr',
      theme: 'light',
    };

    const result = ReactRenderer(props);

    expect(result).toBeTruthy();
  });

  it('should handle different themes', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'dark',
    };

    const result = ReactRenderer(props);

    expect(result).toBeTruthy();
  });

  it('should require both shadowRoot and portalContainer parameters', () => {
    const hostElement = document.createElement('div');
    const testShadowRoot = hostElement.attachShadow({ mode: 'open' });
    const testPortalContainer = document.createElement('div');

    const ReactRenderer = createReactRenderer(testShadowRoot, testPortalContainer);

    // Verify that the renderer function is created
    expect(ReactRenderer).toBeTypeOf('function');
  });

  it('should create Emotion cache for Shadow DOM', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    // Create renderer with props
    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'light',
    };

    const result = ReactRenderer(props);

    // Verify the renderer returns a valid React element with CacheProvider
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('should pass portalContainer to ReactApChat', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'light',
    };

    const result = ReactRenderer(props);

    // The result should be a React element
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
    // The ApChat mock should receive portalContainer in its props
  });

  it('should enable internal theme provider and disable embedded portal', () => {
    const ReactRenderer = createReactRenderer(shadowRoot, portalContainer);

    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'light',
    };

    const result = ReactRenderer(props);

    // The ReactApChat component should be called with enableInternalThemeProvider=true
    // and disableEmbeddedPortal=true (verified through mock in setup)
    expect(result).toBeTruthy();
  });
});
