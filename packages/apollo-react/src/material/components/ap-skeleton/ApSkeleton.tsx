import React, { useEffect } from 'react';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';

import type { ApSkeletonProps } from './ApSkeleton.types';
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

    // Set the background's X position based on the shimmer animation value
    backgroundPositionX: 'var(--ap-skeleton_background-position-x, 0%)',

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
    }),

    // Disable shimmer animation for reduced motion
    '@media (prefers-reduced-motion)': {
        backgroundImage: 'none',
        backgroundPosition: '0% 0%',
    },
}));

/**
 * ApSkeleton is a loading placeholder component that displays a shimmer animation.
 * It supports rectangle, circle, and border variants and respects user's reduced motion preferences.
 */
export const ApSkeleton = React.forwardRef<HTMLDivElement, ApSkeletonProps>(
    ({ variant = 'rectangle', circleSize = 24, children, className, style }, ref) => {
        useEffect(() => {
            // Add body class to enable skeleton animations
            document.body.classList.add('has-skeletons');

            return () => {
                // Remove body class when all skeletons are unmounted
                document.body.classList.remove('has-skeletons');
            };
        }, []);

        return (
            <StyledSkeleton
                ref={ref}
                variant={variant}
                circleSize={circleSize}
                className={className}
                style={style}
            >
                {children}
            </StyledSkeleton>
        );
    }
);

ApSkeleton.displayName = 'ApSkeleton';
