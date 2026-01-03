import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import type { ApCircularProgressProps } from './ApCircularProgress.types';

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export function ApCircularProgress(props: Readonly<ApCircularProgressProps>) {
  const { color = 'var(--color-primary)', size = 64, style } = props;

  const thickness = size / 8;
  const ringSize = size - thickness;

  return (
    <Box
      data-testid="ap-circular-progress"
      data-size={size}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
    >
      <Box
        data-testid="ap-circular-progress-ring"
        data-color={color}
        sx={{
          position: 'relative',
          width: ringSize,
          height: ringSize,
          '& > div': {
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            border: `${thickness}px solid transparent`,
            borderRadius: '50%',
            animation: `${rotateAnimation} 2s cubic-bezier(0.5, 0, 0.5, 1) infinite`,
            borderTopColor: color,
          },
          '& > div:nth-of-type(1)': {
            animationDelay: '-0.45s',
          },
          '& > div:nth-of-type(2)': {
            animationDelay: '-0.3s',
          },
          '& > div:nth-of-type(3)': {
            animationDelay: '-0.15s',
          },
        }}
      >
        <div />
        <div />
        <div />
        <div />
      </Box>
    </Box>
  );
}
