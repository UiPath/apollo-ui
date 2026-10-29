import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

// happy-dom 21 rejects Animation.finished with AbortError when an animation is
// canceled, which happens whenever a presence/tooltip unmounts mid-transition.
// Nothing in these tests awaits that promise, so the rejection fails the run.
const animate = window.Element?.prototype.animate;
if (animate) {
  window.Element.prototype.animate = function animateWithoutUnhandledCancel(...args) {
    const animation = animate.apply(this, args);
    animation.finished.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    });
    return animation;
  };
}

// Extend Vitest's expect with jest-axe matchers (a11y assertions in component suites)
expect.extend(toHaveNoViolations);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Import canvas-specific mocks (from deleted canvas/test/test-setup.ts)
import './canvas-mocks';
