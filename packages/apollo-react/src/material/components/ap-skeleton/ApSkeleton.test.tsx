import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, version } from 'react';
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

function animationStart(element: Element, animationName = SKELETON_SHIMMER_ANIMATION_NAME) {
  const event = new Event('animationstart', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  fireEvent(element, event);
}

describe('ApSkeleton', () => {
  it('renders with the default test id', () => {
    render(<ApSkeleton />);
    expect(screen.getByTestId('ap-skeleton')).toBeTruthy();
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

  it('does not remove a loading marker owned by another component', () => {
    document.body.classList.add('has-skeletons');
    try {
      const { unmount } = render(<ApSkeleton />);
      unmount();
      expect(document.body.classList.contains('has-skeletons')).toBe(true);
    } finally {
      document.body.classList.remove('has-skeletons');
    }
  });

  it('anchors each shimmer start while preserving caller styles and animation handlers', () => {
    const shimmer = {
      effect: { target: null as Element | null },
      animationName: SKELETON_SHIMMER_ANIMATION_NAME,
      startTime: null as number | null,
    };
    const getAnimations = vi.fn(() => [shimmer] as unknown as Animation[]);
    const onAnimationStart = vi.fn();

    try {
      const { rerender } = render(
        <ApSkeleton style={{ width: 120 }} onAnimationStart={onAnimationStart}>
          <span data-testid="child">Content</span>
        </ApSkeleton>
      );
      const skeleton = screen.getByTestId('ap-skeleton');
      Object.defineProperty(skeleton, 'getAnimations', {
        value: getAnimations,
        configurable: true,
      });
      shimmer.effect.target = skeleton;
      animationStart(skeleton);
      expect(shimmer.startTime).toBe(0);
      expect(skeleton.style.width).toBe('120px');
      expect(getAnimations).toHaveBeenCalledWith({ subtree: true });

      shimmer.startTime = 456;
      animationStart(skeleton);
      expect(shimmer.startTime).toBe(0);
      expect(getAnimations).toHaveBeenCalledTimes(2);

      animationStart(screen.getByTestId('child'));
      animationStart(skeleton, 'some-other-animation');
      expect(getAnimations).toHaveBeenCalledTimes(2);
      expect(onAnimationStart).toHaveBeenCalledTimes(4);

      rerender(<ApSkeleton style={{ width: 80 }} onAnimationStart={onAnimationStart} />);
      expect(skeleton.style.width).toBe('80px');
      expect(getAnimations).toHaveBeenCalledTimes(2);
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

  it.skipIf(Number.parseInt(version, 10) < 19)(
    'preserves React 19 callback-ref cleanup on unmount',
    () => {
      const cleanup = vi.fn();
      const ref = vi.fn((node: HTMLDivElement | null) => (node ? cleanup : undefined));
      const { unmount } = render(<ApSkeleton ref={ref} />);
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(ref).toHaveBeenCalledTimes(1);
    }
  );

  it.skipIf(Number.parseInt(version, 10) < 19)(
    'cleans up the previous callback ref on replacement',
    () => {
      const firstCleanup = vi.fn();
      const secondCleanup = vi.fn();
      const first = vi.fn((node: HTMLDivElement | null) => (node ? firstCleanup : undefined));
      const second = vi.fn((node: HTMLDivElement | null) => (node ? secondCleanup : undefined));
      const { rerender, unmount } = render(<ApSkeleton ref={first} />);
      rerender(<ApSkeleton ref={second} />);
      expect(firstCleanup).toHaveBeenCalledTimes(1);
      expect(secondCleanup).not.toHaveBeenCalled();
      unmount();
      expect(secondCleanup).toHaveBeenCalledTimes(1);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    }
  );
});

describe('syncSkeletonShimmer', () => {
  it('anchors only the host shimmer, including its pseudo-element, without retiming descendants', () => {
    const element = document.createElement('div');
    const shimmer = {
      effect: { target: element },
      animationName: SKELETON_SHIMMER_ANIMATION_NAME,
      startTime: null as number | null,
    };
    const child = {
      effect: { target: document.createElement('span') },
      animationName: SKELETON_SHIMMER_ANIMATION_NAME,
      startTime: 99 as number | null,
    };
    const other = {
      effect: { target: element },
      animationName: 'some-other-animation',
      startTime: 42 as number | null,
    };
    const getAnimations = vi.fn(() => [shimmer, child, other] as unknown as Animation[]);
    Object.defineProperty(element, 'getAnimations', { value: getAnimations });
    syncSkeletonShimmer(element);
    expect(shimmer.startTime).toBe(0);
    expect(child.startTime).toBe(99);
    expect(other.startTime).toBe(42);
    expect(getAnimations).toHaveBeenCalledWith({ subtree: true });
    expect(element.style.getPropertyValue(SKELETON_SHIMMER_DELAY_CSS_PROPERTY)).toBe('');
  });

  it('falls back to a negative sync delay without the Web Animations API', () => {
    const element = document.createElement('div');
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
  it('normalizes rounded cycle boundaries and negative timeline offsets', () => {
    expect(getSkeletonShimmerSyncDelay(0)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(500)).toBe('-500ms');
    expect(getSkeletonShimmerSyncDelay(1999.6)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(-0.4)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(SKELETON_SHIMMER_DURATION_MS)).toBe('0ms');
    expect(getSkeletonShimmerSyncDelay(3 * SKELETON_SHIMMER_DURATION_MS + 1234.4)).toBe('-1234ms');
  });

  it('puts skeletons mounted at different times at the same point of the cycle', () => {
    const phaseAt = (t: number, start: number) => {
      const delay = Number.parseInt(getSkeletonShimmerSyncDelay(start), 10);
      return (t - start - delay) % SKELETON_SHIMMER_DURATION_MS;
    };
    expect(phaseAt(10_000, 1_250)).toBe(phaseAt(10_000, 7_900));
  });
});
