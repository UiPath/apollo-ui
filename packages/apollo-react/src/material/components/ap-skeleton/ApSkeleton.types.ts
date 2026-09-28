import type React from 'react';

export type SkeletonVariant = 'rectangle' | 'circle' | 'border';

export interface ApSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The variant of the skeleton (default: rectangle) */
  variant?: SkeletonVariant;
  /** The size for the circle variant (default: 24) */
  circleSize?: number;
  /**
   * Test ID for testing purposes
   * @default 'ap-skeleton'
   */
  'data-testid'?: string;
}
