import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import type { ApSkeletonProps } from './ApSkeleton.types';
import {
  SKELETON_SHIMMER_ANIMATION_NAME,
  SKELETON_SHIMMER_DELAY_CSS_PROPERTY,
  SKELETON_SHIMMER_DURATION_MS,
  syncSkeletonShimmer,
} from './ApSkeleton.utils';
import './ApSkeleton.css';

// `useLayoutEffect` in the browser (runs before the first paint, i.e. before the animation starts),
// `useEffect` on the server to avoid React's SSR warning.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const StyledSkeleton = styled('div')<{
  variant: 'rectangle' | 'circle' | 'border';
  circleSize?: number;
}>(({ variant, circleSize }) => ({
  position: 'relative',
  display: 'inline-block',
  borderRadius: token.Border.BorderRadiusM,
  flexShrink: 0,
  flexGrow: 1,
  boxSizing: 'border-box',

  // Setting the solid background color
  backgroundColor: 'var(--color-skeleton)',

  // Setting the shimmer gradient as a background image which will be animated
  backgroundImage: `linear-gradient(
        to right,
        var(--color-skeleton) 0%,
        var(--color-skeleton-glow) 50%,
        var(--color-skeleton) 100%
    )`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0% 0%',

  // Setting the background size to be a square using the viewport's larger dimension
  backgroundSize: '200vmax 200vmax',

  // This is the trick to make the background be always positioned to the top left
  // corner of the viewport regardless of the component's size or position
  backgroundAttachment: 'fixed',

  // Animate this element's own background. The animation only affects this element, unlike the previous
  // implementation which animated an inherited custom property on <body> and forced a style recalculation
  // of the whole document on every frame. All skeletons are put in phase when they mount
  // (see `syncSkeletonShimmer`).
  animation: `${SKELETON_SHIMMER_ANIMATION_NAME} ${SKELETON_SHIMMER_DURATION_MS}ms linear infinite`,
  animationDelay: `var(${SKELETON_SHIMMER_DELAY_CSS_PROPERTY}, 0ms)`,

  // Render a space character so the skeleton size adapts to the parent's font-size
  '&:empty::before': {
    content: '"\\00a0"',
    userSelect: 'none',
  },

  // Circle variant styles
  ...(variant === 'circle' && {
    borderRadius: '10000px',
    width: `${circleSize}px !important`,
    height: `${circleSize}px !important`,
    flex: '0 0 auto',
  }),

  // Border variant styles
  ...(variant === 'border' && {
    opacity: 'unset',
    background: 'none',
    backgroundImage: 'none',
    border: '1px solid var(--color-skeleton)',
    animation: 'none',
  }),

  // Disable shimmer animation for reduced motion
  '@media (prefers-reduced-motion)': {
    backgroundImage: 'none',
    backgroundPosition: '0% 0%',
    animation: 'none',
  },
}));

/**
 * ApSkeleton is a loading placeholder component that displays a shimmer animation.
 * It supports rectangle, circle, and border variants and respects user's reduced motion preferences.
 */
export const ApSkeleton = React.forwardRef<HTMLDivElement, ApSkeletonProps>(
  (
    {
      variant = 'rectangle',
      circleSize = 24,
      children,
      className,
      style,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        elementRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Align this skeleton's shimmer with every other skeleton on the page. Done on the element after mount (not via
    // the `style` prop) so it only runs on the client and never causes an SSR hydration mismatch.
    useIsomorphicLayoutEffect(() => {
      if (elementRef.current) {
        syncSkeletonShimmer(elementRef.current);
      }
    }, []);

    return (
      <StyledSkeleton
        ref={setRefs}
        variant={variant}
        circleSize={circleSize}
        className={className}
        style={style}
        data-testid={testId || 'ap-skeleton'}
        {...rest}
      >
        {children}
      </StyledSkeleton>
    );
  }
);

ApSkeleton.displayName = 'ApSkeleton';
