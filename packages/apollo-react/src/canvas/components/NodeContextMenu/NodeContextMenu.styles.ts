import styled from '@emotion/styled';

export const MenuButton = styled.div<{ $isVisible?: boolean }>`
  position: absolute;
  transform: translateY(-100%);
  top: 0;
  right: 0;
  background: transparent;
  border: none;
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  pointer-events: ${(props) => (props.$isVisible ? 'auto' : 'none')};
  transition: opacity 0.3s ease-in-out;
  z-index: 10;
  padding: 4px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`;
