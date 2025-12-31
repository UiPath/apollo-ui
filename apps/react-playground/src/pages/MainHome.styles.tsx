import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const MainContainer = styled.div`
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

export const MainTitle = styled.h1`
  font-size: 48px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const MainDescription = styled.p`
  font-size: 20px;
  color: var(--color-foreground-de-emp);
  max-width: 600px;
  margin: 0 auto;
`;

export const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 1000px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  position: relative;
`;

export const SectionCard = styled.div<{ $opacity: number }>`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: var(--shadow-hover-md);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: ${(props) => props.$opacity};
`;

export const WipBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--color-warning-500);
  color: var(--color-background);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

export const SectionIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--color-foreground-emp);
  font-weight: bold;
`;

export const SectionDescription = styled.p`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  line-height: 1.5;
`;
