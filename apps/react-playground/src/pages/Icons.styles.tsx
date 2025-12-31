import styled from 'styled-components';

// Search Input
export const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  font-size: 16px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  margin-bottom: 32px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(250, 70, 22, 0.1);
  }

  &::placeholder {
    color: var(--color-foreground-de-emp);
  }
`;

// Icon Browser Grid (dense layout like Lucide)
export const IconBrowserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  margin-top: 24px;
`;

// Icon Browser Card (minimal card like Lucide)
export const IconBrowserCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 110px;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);

    svg {
      color: var(--color-primary);
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Icon name label
export const IconLabel = styled.div`
  font-size: 10px;
  color: var(--color-foreground-de-emp);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

// Sizing Tokens Grid (larger cards for sizing demonstrations)
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
`;

export const IconCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 32px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const IconInfo = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

export const IconName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 8px;
`;

export const IconValue = styled.code`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
`;

export const IconVisual = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100px;
  margin-bottom: 16px;
`;

export const IconCircle = styled.div<{ $size: string }>`
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: 50%;
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-sm);
`;

export const IconDimensions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: var(--color-foreground);
`;
