import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApSkeleton } from './ApSkeleton';
import {
  getSkeletonShimmerSyncDelay,
  SKELETON_SHIMMER_ANIMATION_NAME,
  SKELETON_SHIMMER_DELAY_CSS_PROPERTY,
  SKELETON_SHIMMER_DURATION_MS,
  syncSkeletonShimmer,
} from './ApSkeleton.utils';

const DELAY_PATTERN = /^-?\d+ms$/;

describe('ApSkeleton', () => {
  it('renders with the default test id', () => {
    render(<ApSkeleton />);
    expect(screen.getByTestId('ap-skeleton')).toBeInTheDocument();
  });

  it('does not toggle a document-wide class on body', () => {
    const { unmount } = render(
      <>
        <ApSkeleton data-testid="first" />
        <ApSkeleton data-testid="second" />
      </>
    );

    expect(document.body.classList.contains('has-skeletons')).toBe(false);

    unmount();
    expect(document.body.classList.contains('has-skeletons')).toBe(false);
  });

  // The test DOM implements `getAnimations()` but computes no CSS animations, so a fake shimmer animation is
  // returned to observe what the component does with it.
  it('anchors its shimmer animation on mount, once, and keeps the consumer style prop', () => {
    const shimmer = {
      animationName: SKELETON_SHIMMER_ANIMATION_NAME,
      startTime: null as number | null,
    };
    const getAnimations = vi
      .spyOn(Element.prototype, 'getAnimations')
      .mockImplementation(() => [shimmer] as unknown as Animation[]);

    try {
      const { rerender } = render(<ApSkeleton style={{ width: 120 }} />);
      const skeleton = screen.getByTestId('ap-skeleton');

      expect(shimmer.startTime).toBe(0);
      expect(skeleton.style.width).toBe('120px');

      rerender(<ApSkeleton style={{ width: 80 }} />);
      expect(skeleton.style.width).toBe('80px');
      expect(getAnimations).toHaveBeenCalledTimes(1);
    } finally {
      getAnimations.mockRestore();
    }
  });

  it('forwards object refs and callback refs to the element', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();

    render(
      <>
        <ApSkeleton ref={objectRef} data-testid="object-ref" />
        <ApSkeleton ref={callbackRef} data-testid="callback-ref" />
      </>
    );

    expect(objectRef.current).toBe(screen.getByTestId('object-ref'));
    expect(callbackRef).toHaveBeenCalledWith(screen.getByTestId('callback-ref'));
  });
});

describe('syncSkeletonShimmer', () => {
  it('anchors only the shimmer animation to the start of the document timeline when the Web Animations API exists', () => {
    const shimmer = {
      animationName: SKELETON_SHIMMER_ANIMATION_NAME,
      startTime: null as number | null,
    };
    const other = { animationName: 'some-other-animation', startTime: 42 as number | null };
    const element = document.createElement('div');
    element.getAnimations = () => [shimmer, other] as unknown as Animation[];

    syncSkeletonShimmer(element);

    expect(shimmer.startTime).toBe(0);
    expect(other.startTime).toBe(42);
    // The delay fallback must not be applied on top: it would shift the anchored phase
    expect(element.style.getPropertyValue(SKELETON_SHIMMER_DELAY_CSS_PROPERTY)).toBe('');
  });

  it('falls back to a negative sync delay when the Web Animations API is not available', () => {
    const element = document.createElement('div');
    // Simulate an environment without `Element.prototype.getAnimations`
    Object.defineProperty(element, 'getAnimations', { value: undefined });

    syncSkeletonShimmer(element);

    const delay = element.style.getPropertyValue(SKELETON_SHIMMER_DELAY_CSS_PROPERTY);
    expect(delay).toMatch(DELAY_PATTERN);

    const delayMs = Number.parseInt(delay, 10);
    expect(delayMs).toBeLessThanOrEqual(0);
    expect(delayMs).toBeGreaterThan(-SKELETON_SHIMMER_DURATION_MS);
  });
});

describe('getSkeletonShimmerSyncDelay', () => {
  it('returns the delay that aligns an animation started at any time with the shared phase', () => {
    expect(getSkeletonShimmerSyncDelay(0)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(500)).toBe('-500ms');
    expect(getSkeletonShimmerSyncDelay(SKELETON_SHIMMER_DURATION_MS)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(3 * SKELETON_SHIMMER_DURATION_MS + 1234.4)).toBe('-1234ms');
  });

  it('puts skeletons mounted at different times at the same point of the cycle', () => {
    // phase(t) = (t - start - delay) mod duration
    const phaseAt = (t: number, start: number) => {
      const delay = Number.parseInt(getSkeletonShimmerSyncDelay(start), 10);
      return (t - start - delay) % SKELETON_SHIMMER_DURATION_MS;
    };

    expect(phaseAt(10_000, 1_250)).toBe(phaseAt(10_000, 7_900));
  });
});
