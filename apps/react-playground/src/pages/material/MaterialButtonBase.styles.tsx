import styled from "styled-components";

export const VariantSection = styled.section`
  margin-bottom: 48px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ButtonGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

export const StyledButtonBase = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
  }

  &:active {
    transform: scale(0.98);
  }
`;
