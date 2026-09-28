import { keyframes, styled } from '@mui/material';

import { useLoading } from '../../../providers/loading-provider';
import { CHAT_LOADER_GRADIENT_WIDTH } from '../../../service';
import { LoadingMessage } from './chat-loading-text';

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-${CHAT_LOADER_GRADIENT_WIDTH}px);
  }
  100% {
    transform: translateX(${CHAT_LOADER_GRADIENT_WIDTH}px);
  }
`;

const LoadingMessageContainer = styled('div')(() => ({
  position: 'relative',
  display: 'inline-block',
  overflow: 'hidden',
  width: 'fit-content',

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${CHAT_LOADER_GRADIENT_WIDTH}px`,
    height: '100%',
    background: `linear-gradient(
            90deg,
            var(--color-background)20 0%,
            var(--color-background)40 25%,
            var(--color-background)80 50%,
            var(--color-background)40 75%,
            var(--color-background)20 100%
        )`,
    animation: `${shimmerAnimation} 2s ease-in-out infinite`,
  },
}));

export function AutopilotChatLoading() {
  const { showLoading } = useLoading();

  if (!showLoading) {
    return null;
  }

  return (
    <LoadingMessageContainer>
      <LoadingMessage />
    </LoadingMessageContainer>
  );
}
