// Enable React act() environment - must be set before React imports
// @ts-expect-error - React internal
global.IS_REACT_ACT_ENVIRONMENT = true;
// @ts-expect-error - React internal
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock IntersectionObserver for components that use it (like Carousel from embla)
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  constructor() {
    // Mock
  }
  observe() {
    // Mock
  }
  unobserve() {
    // Mock
  }
  disconnect() {
    // Mock
  }
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver for components that use it (like Command from cmdk)
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    // Mock implementation
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {
  // Mock implementation
};

// Mock hasPointerCapture for jsdom (needed for Radix UI Select)
Element.prototype.hasPointerCapture = () => false;

// Mock setPointerCapture and releasePointerCapture for jsdom
Element.prototype.setPointerCapture = () => {
  // Mock implementation
};

Element.prototype.releasePointerCapture = () => {
  // Mock implementation
};

// Mock matchMedia for components that use media queries (like Drawer/vaul)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// Mock Image for Avatar component tests
// This allows the onload callback to fire in jsdom
Object.defineProperty(global.Image.prototype, 'src', {
  set(src) {
    if (src) {
      setTimeout(() => {
        this.onload?.();
      }, 0);
    }
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
