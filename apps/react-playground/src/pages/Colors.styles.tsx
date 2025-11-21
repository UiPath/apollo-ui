import styled from "styled-components";

export const SearchInput = styled.input`
  width: 100%;
  max-width: 600px;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
  background: var(--color-background);
  color: var(--color-foreground-emp);

  &:focus {
    border-color: var(--color-primary);
  }
`;

export const NoResultsContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--color-foreground);
`;

export const NoResultsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const NoResultsTitle = styled.div`
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-foreground-de-emp);
`;

export const NoResultsText = styled.div`
  font-size: 16px;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const ColorGroup = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
`;

export const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const GroupTitle = styled.h3`
  font-size: 18px;
  margin: 0;
  color: var(--color-foreground-emp);
  font-weight: bold;
`;

export const GroupCount = styled.div`
  font-size: 12px;
  color: var(--color-foreground);
  background: var(--color-background-hover);
  padding: 4px 10px;
  border-radius: 12px;
`;

export const ColorGrid = styled.div<{ $columns?: string }>`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "repeat(auto-fit, minmax(100px, 1fr))"};
  gap: 8px;
`;

export const ColorCard = styled.div<{ $bgColor: string }>`
  background: ${(props) => props.$bgColor};
  border-radius: 6px;
  padding: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.2s;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const ColorName = styled.div<{
	$textColor: string;
	$textShadow: string;
}>`
  font-size: 10px;
  font-weight: bold;
  color: ${(props) => props.$textColor};
  text-shadow: ${(props) => props.$textShadow};
  margin-bottom: 6px;
  word-break: break-word;
`;

export const ColorValue = styled.div<{
	$textColor: string;
	$textShadow: string;
	$isLight: boolean;
}>`
  font-size: 9px;
  font-family: monospace;
  color: ${(props) => props.$textColor};
  text-shadow: ${(props) => props.$textShadow};
  background: ${(props) => (props.$isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.3)")};
  padding: 3px 5px;
  border-radius: 3px;
`;
