import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  cleanupReactRenderer,
  createReactRenderer,
} from '../react-renderer';
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
  let emotionContainer: HTMLElement;
  let mockService: any;

  beforeEach(() => {
    emotionContainer = document.createElement('div');
    emotionContainer.id = 'emotion-container';
    
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
    const ReactRenderer = createReactRenderer(emotionContainer);
    
    expect(ReactRenderer).toBeTypeOf('function');
  });

  it('should return a function that accepts ApChatProperties', () => {
    const ReactRenderer = createReactRenderer(emotionContainer);
    
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
    const ReactRenderer = createReactRenderer(emotionContainer);
    
    const props: ApChatProperties = {
      chatServiceInstance: mockService,
    };

    const result = ReactRenderer(props);
    
    expect(result).toBeTruthy();
  });

  it('should handle different locales', () => {
    const ReactRenderer = createReactRenderer(emotionContainer);
    
    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'fr',
      theme: 'light',
    };

    const result = ReactRenderer(props);
    
    expect(result).toBeTruthy();
  });

  it('should handle different themes', () => {
    const ReactRenderer = createReactRenderer(emotionContainer);
    
    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'dark',
    };

    const result = ReactRenderer(props);
    
    expect(result).toBeTruthy();
  });

  it('should use custom emotion container for direct style injection', () => {
    const customContainer = document.createElement('div');
    customContainer.id = 'custom-emotion';
    
    const ReactRenderer = createReactRenderer(customContainer);
    
    // Verify that the renderer function is created
    expect(ReactRenderer).toBeTypeOf('function');
  });

  it('should create Emotion cache with shared MutationObserver', () => {
    const testContainer = document.createElement('div');
    testContainer.id = 'test-emotion-container';
    
    const ReactRenderer = createReactRenderer(testContainer);
    
    // Create renderer with props
    const props: ApChatProperties = {
      chatServiceInstance: mockService,
      locale: 'en',
      theme: 'light',
    };

    const result = ReactRenderer(props);
    
    // Verify the renderer returns a valid React element
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('should mirror Emotion styles from document.head to container', async () => {
    const testContainer = document.createElement('div');
    testContainer.id = 'mirror-test-container';
    
    createReactRenderer(testContainer);
    
    // Simulate Emotion adding a style to document.head
    const emotionStyle = document.createElement('style');
    emotionStyle.setAttribute('data-emotion', 'ap-chat');
    emotionStyle.textContent = '.test-class { color: blue; }';
    
    document.head.appendChild(emotionStyle);
    
    // Wait for MutationObserver callback
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check that style was mirrored to container
    const mirroredStyles = testContainer.querySelectorAll('style[data-emotion]');
    expect(mirroredStyles.length).toBeGreaterThan(0);
    expect(mirroredStyles[0]?.textContent).toBe('.test-class { color: blue; }');
    
    // Cleanup
    document.head.removeChild(emotionStyle);
    cleanupReactRenderer(testContainer);
  });

  it('should cleanup observer callback when cleanupReactRenderer is called', async () => {
    const testContainer = document.createElement('div');
    testContainer.id = 'cleanup-test-container';
    
    createReactRenderer(testContainer);
    
    // Add a style and verify it mirrors
    const style1 = document.createElement('style');
    style1.setAttribute('data-emotion', 'ap-chat');
    style1.textContent = '.before-cleanup { }';
    document.head.appendChild(style1);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(testContainer.querySelectorAll('style').length).toBe(1);
    
    // Cleanup this container
    cleanupReactRenderer(testContainer);
    
    // Add another style after cleanup
    const style2 = document.createElement('style');
    style2.setAttribute('data-emotion', 'ap-chat');
    style2.textContent = '.after-cleanup { }';
    document.head.appendChild(style2);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should still only have 1 style (the second one shouldn't be mirrored)
    expect(testContainer.querySelectorAll('style').length).toBe(1);
    
    // Cleanup
    document.head.removeChild(style1);
    document.head.removeChild(style2);
  });

  it('should share single MutationObserver across multiple containers', async () => {
    const container1 = document.createElement('div');
    container1.id = 'shared-container-1';
    const container2 = document.createElement('div');
    container2.id = 'shared-container-2';
    
    createReactRenderer(container1);
    createReactRenderer(container2);
    
    // Add a single style to document.head
    const sharedStyle = document.createElement('style');
    sharedStyle.setAttribute('data-emotion', 'ap-chat');
    sharedStyle.textContent = '.shared { }';
    document.head.appendChild(sharedStyle);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Both containers should receive the mirrored style
    expect(container1.querySelectorAll('style[data-emotion]').length).toBeGreaterThan(0);
    expect(container2.querySelectorAll('style[data-emotion]').length).toBeGreaterThan(0);
    
    // Cleanup
    document.head.removeChild(sharedStyle);
    cleanupReactRenderer(container1);
    cleanupReactRenderer(container2);
  });
});

