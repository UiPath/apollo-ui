import type React from 'react';

export interface ApCircularProgressProps {
  /**
   * The color of the circular progress indicator
   * @default 'var(--color-primary)'
   */
  color?: string;
  /**
   * The size of the circular progress indicator in pixels
   * @default 64
   */
  size?: number;
  /**
   * Additional inline styles to apply to the root element
   */
  style?: React.CSSProperties;
}
