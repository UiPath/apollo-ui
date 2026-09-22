// Enable React act() environment - must be set before React imports
// @ts-expect-error - React internal
global.IS_REACT_ACT_ENVIRONMENT = true;
// @ts-expect-error - React internal
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

expect.extend(toHaveNoViolations);

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

global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
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
};

Element.prototype.scrollIntoView = () => {
  // Mock
};

Element.prototype.hasPointerCapture = () => false;

Element.prototype.setPointerCapture = () => {
  // Mock
};

Element.prototype.releasePointerCapture = () => {
  // Mock
};

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

afterEach(() => {
  cleanup();
});
