import { Link } from "react-router-dom";
import styled from "styled-components";

export const CenterContainer = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

export const GradientTitle = styled.h1`
  font-size: 48px;
  margin: 0 0 20px 0;
  background: linear-gradient(
    135deg,
    var(--color-brand-primary) 0%,
    var(--color-secondary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Subtitle = styled.p`
  font-size: 20px;
  color: var(--color-foreground-de-emp);
  max-width: 600px;
  margin: 0 auto;
`;

export const InfoBox = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: var(--color-background-selected);
  border-radius: 12px;
  border: 2px solid var(--color-primary);
  max-width: 800px;
  margin: 30px auto 0;
`;

export const InfoItem = styled.p`
  margin: 5px 0;
  font-size: 16px;
  color: var(--color-foreground-emp);
`;

export const InlineCode = styled.code`
  background: var(--color-background);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--color-foreground-emp);
`;

export const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

export const CategoryCard = styled(Link)`
  text-decoration: none;
  color: inherit;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  padding: 30px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }
`;

export const CategoryIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const CategoryTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 24px;
  color: var(--color-foreground-emp);
`;

export const CategoryDescription = styled.p`
  margin: 0 0 16px 0;
  color: var(--color-foreground-de-emp);
  font-size: 14px;
  line-height: 1.6;
`;

export const CategoryBadge = styled.div`
  display: inline-block;
  padding: 6px 12px;
  background: var(--color-background-selected);
  color: var(--color-primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
`;
