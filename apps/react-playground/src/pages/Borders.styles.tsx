import styled from "styled-components";

export const Section = styled.section<{ $marginBottom?: string }>`
  margin-bottom: ${(props) => props.$marginBottom || "0"};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

export const BorderCard = styled.div<{ $isDark?: boolean }>`
  background: ${(props) =>
		props.$isDark
			? "var(--color-background)"
			: "var(--color-background-secondary)"};
  border: ${(props) =>
		props.$isDark
			? "2px solid var(--color-border)"
			: "2px solid var(--color-border)"};
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
`;

export const TokenInfo = styled.div`
  margin-bottom: 16px;
`;

export const TokenName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 4px;
`;

export const TokenValue = styled.code<{ $isDark?: boolean }>`
  font-size: 14px;
  color: ${(props) =>
		props.$isDark
			? "var(--color-foreground-de-emp)"
			: "var(--color-foreground-de-emp)"};
`;

export const RadiusDemo = styled.div<{ $radius: string }>`
  width: 100%;
  height: 100px;
  border: 3px solid var(--color-primary);
  border-radius: ${(props) => props.$radius};
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: bold;
  font-size: 14px;
  background: var(--color-background);
`;

export const WidthDemo = styled.div<{ $width: string }>`
  width: 100%;
  height: 80px;
  border: ${(props) => props.$width} solid var(--color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: bold;
  background: var(--color-background);
`;

export const SemanticBorderDemo = styled.div<{
	$border: string;
	$isDark?: boolean;
}>`
  width: 100%;
  padding: 20px;
  border: ${(props) => props.$border};
  border-radius: 8px;
  background: ${(props) => (props.$isDark ? "var(--color-background)" : "var(--color-background)")};
  font-size: 14px;
  color: ${(props) => (props.$isDark ? "var(--color-foreground)" : "var(--color-foreground-emp)")};
  line-height: 1.6;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const GenericDisplay = styled.div`
  padding: 20px;
  background: var(--color-background-hover);
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  color: var(--color-foreground-emp);
  text-align: center;
`;

export const StrokeDemo = styled.div`
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StrokeSection = styled.div``;

export const StrokeLabel = styled.div`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  margin-bottom: 8px;
  font-weight: 500;
`;
