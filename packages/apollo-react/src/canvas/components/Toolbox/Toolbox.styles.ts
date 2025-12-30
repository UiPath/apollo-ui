import styled from '@emotion/styled';

export const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 250px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uix-canvas-border-de-emp);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--uix-canvas-border);
  }
`;

export const AnimatedContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
`;

export const AnimatedContent = styled.div<{ entering?: boolean; direction?: 'forward' | 'back' }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: ${(props) => (props.entering ? `slideIn-${props.direction}` : 'none')} 0.15s ease-out;
  min-height: 300px;

  @keyframes slideIn-forward {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideIn-back {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
