import styled from 'styled-components';

export const PageContainer = styled.div`
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

export const PageTitle = styled.h1`
  font-size: 36px;
  margin-bottom: 12px;
  color: var(--color-foreground-emp);
`;

export const PageDescription = styled.p`
  color: var(--color-foreground-de-emp);
  margin-bottom: 40px;
  font-size: 16px;
`;

export const SectionHeader = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--color-foreground-emp);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 12px;
`;

export const SectionDescription = styled.p`
  color: var(--color-foreground-de-emp);
  font-size: 14px;
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }
`;

export const TokenName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 4px;
`;

export const TokenValue = styled.code`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
`;
