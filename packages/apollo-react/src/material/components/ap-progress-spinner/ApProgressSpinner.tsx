import { CircularProgress } from '@mui/material';
import type { ApProgressSpinnerProps, ApProgressSpinnerSize } from './ApProgressSpinner.types';

const sizeMapping: Record<ApProgressSpinnerSize, number> = {
  xs: 12,
  s: 16,
  m: 24,
  l: 32,
  xl: 44,
  xxl: 72,
};

export function ApProgressSpinner(props: Readonly<ApProgressSpinnerProps>) {
  const { size = 'm', color = 'primary', 'aria-label': ariaLabel = 'Loading' } = props;

  return (
    <CircularProgress
      size={sizeMapping[size]}
      color={color}
      aria-label={ariaLabel}
      data-testid="ap-progress-spinner"
      data-size={size}
    />
  );
}
