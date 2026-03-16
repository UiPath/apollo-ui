import { css, keyframes } from '@emotion/react';

export const pulseAnimation = (cssVar: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(${cssVar}) 20%, transparent);
  }
  70% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(${cssVar}) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(${cssVar}) 0%, transparent);
  }
`;

export const getExecutionStatusBorder = (executionStatus?: string) => {
  switch (executionStatus) {
    case 'NotExecuted':
    case 'INFO':
      return css`
        border-color: var(--uix-canvas-border-de-emp);
      `;
    case 'InProgress': {
      return css`
        border-color: var(--uix-canvas-info-icon);
        animation: ${pulseAnimation('--uix-canvas-info-icon')} 2s infinite;
      `;
    }
    case 'Completed':
      return css`
        border-color: var(--uix-canvas-success-icon);
      `;
    case 'Paused':
    case 'WARNING': {
      return css`
        border-color: var(--uix-canvas-warning-icon);
        animation: ${pulseAnimation('--uix-canvas-warning-icon')} 2s infinite;
      `;
    }
    case 'Cancelled':
    case 'Failed':
    case 'Terminated':
    case 'ERROR':
    case 'CRITICAL': {
      return css`
        border-color: var(--uix-canvas-error-icon);
        background: var(--uix-canvas-error-background);
        animation: ${pulseAnimation('--uix-canvas-error-icon')} 2s infinite;
      `;
    }
    default:
      return css`
        border-color: var(--uix-canvas-border-de-emp);
      `;
  }
};
