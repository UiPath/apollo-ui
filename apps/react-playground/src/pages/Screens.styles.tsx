import styled from "styled-components";

export const OverviewCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 32px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 40px;
`;

export const OverviewTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 24px;
  color: var(--color-foreground-emp);
`;

export const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

export const OverviewItem = styled.div`
  background: var(--color-background-hover);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
`;

export const OverviewLabel = styled.div`
  font-size: 12px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 8px;
`;

export const OverviewValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: var(--color-foreground-emp);
`;

export const ScreenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const ScreenCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
`;

export const ScreenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const ScreenInfo = styled.div``;

export const ScreenName = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 4px;
`;

export const ScreenValue = styled.code`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
`;

export const DeviceIcon = styled.div`
  font-size: 32px;
`;

export const VisualContainer = styled.div`
  background: var(--color-background-hover);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow: hidden;
`;

export const VisualBase = styled.div`
  width: 100%;
  height: 120px;
  border: 2px dashed var(--color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 16px;
  font-weight: bold;
  background: var(--color-background-tint-primary);
`;

export const VisualViewport = styled.div<{ $width: string }>`
  width: min(100%, ${(props) => props.$width});
  height: 120px;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-background);
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
`;

export const MediaQuery = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: var(--color-background-hover);
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  color: var(--color-foreground-emp);
`;

export const MediaQueryComment = styled.div`
  color: var(--color-foreground);
  margin-bottom: 8px;
`;
