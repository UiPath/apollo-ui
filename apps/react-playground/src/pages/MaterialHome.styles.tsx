import styled from 'styled-components';

export const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Subtitle = styled.p`
  font-size: 20px;
  color: var(--color-foreground-de-emp);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

export const Description = styled.p`
  font-size: 16px;
  color: var(--color-foreground-de-emp);
  line-height: 1.8;
  margin: 0 0 48px 0;
  max-width: 800px;
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 64px;
`;

export const FeatureCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }

  p {
    font-size: 14px;
    color: var(--color-foreground-de-emp);
    line-height: 1.6;
    margin: 0;
  }
`;

export const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 16px 0 12px 0;
`;

export const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
`;

export const ComponentCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
    border-color: var(--color-primary);
  }
`;

export const ComponentIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

export const ComponentLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground-emp);
`;
