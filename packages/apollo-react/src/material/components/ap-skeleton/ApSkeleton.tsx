import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import type { ApSkeletonProps } from './ApSkeleton.types';
import {
  SKELETON_SHIMMER_ANIMATION_NAME,
  SKELETON_SHIMMER_DELAY_CSS_PROPERTY,
  SKELETON_SHIMMER_DURATION_MS,
  syncSkeletonShimmer,
} from './ApSkeleton.utils';
import './ApSkeleton.css';

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

  overflow: 'hidden',
  isolation: 'isolate',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    pointerEvents: 'none',
    backgroundImage:
      'linear-gradient(to right, transparent 0%, var(--color-skeleton-glow) 50%, transparent 100%)',
    transform: 'translateX(-100%)',
    animation: `${SKELETON_SHIMMER_ANIMATION_NAME} ${SKELETON_SHIMMER_DURATION_MS}ms linear infinite`,
    animationDelay: `var(${SKELETON_SHIMMER_DELAY_CSS_PROPERTY}, 0ms)`,
  },

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
    overflow: 'visible',
    isolation: 'auto',
    '&::after': { display: 'none', animation: 'none' },
    border: '1px solid var(--color-skeleton)',
  }),

  // Disable shimmer animation for reduced motion
  '@media (prefers-reduced-motion: reduce)': {
    '&::after': { display: 'none', animation: 'none' },
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
      onAnimationStart,
      ...rest
    },
    ref
  ) => {
    return (
      <StyledSkeleton
        ref={ref}
        variant={variant}
        circleSize={circleSize}
        className={className}
        style={style}
        data-testid={testId || 'ap-skeleton'}
        {...rest}
        onAnimationStart={(event) => {
          if (
            event.target === event.currentTarget &&
            event.animationName === SKELETON_SHIMMER_ANIMATION_NAME
          ) {
            syncSkeletonShimmer(event.currentTarget);
          }
          onAnimationStart?.(event);
        }}
      >
        {children}
      </StyledSkeleton>
    );
  }
);

ApSkeleton.displayName = 'ApSkeleton';
