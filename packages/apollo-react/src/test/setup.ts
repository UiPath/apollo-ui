import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, expect } from 'vitest';

// Extend Vitest's expect with jest-axe matchers (a11y assertions in component suites)
expect.extend(toHaveNoViolations);

// happy-dom implements Element.animate, so motion would start real animations whose cancel()
// rejects `finished` with an unhandled AbortError. Jump straight to the final keyframe instead.
MotionGlobalConfig.skipAnimations = true;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Import canvas-specific mocks (from deleted canvas/test/test-setup.ts)
import './canvas-mocks';
