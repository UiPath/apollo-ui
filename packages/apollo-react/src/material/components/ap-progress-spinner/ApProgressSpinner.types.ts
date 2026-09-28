import type { CircularProgressProps } from '@mui/material';

export type ApProgressSpinnerSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

export interface ApProgressSpinnerProps {
  /**
   * The size of the progress spinner
   * @default 'm'
   */
  size?: ApProgressSpinnerSize;
  /**
   * The color of the progress spinner
   * @default 'primary'
   */
  color?: CircularProgressProps['color'];
  /**
   * Accessible label for the progress spinner
   */
  'aria-label'?: string;
}
