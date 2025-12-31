import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 24px;
`;

export const TypeCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }
`;

export const DecorativeCorner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--color-primary) 10 0%, transparent 100%);
  border-radius: 0 16px 0 100%;
`;

export const TypeCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

export const TokenName = styled.h3`
  font-size: 16px;
  margin: 0;
  color: var(--color-primary);
  font-weight: bold;
`;

export const PropertyBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  font-size: 11px;
`;

export const Badge = styled.code<{ $primary?: boolean }>`
  background: ${(props) =>
    props.$primary ? 'var(--color-background-selected)' : 'var(--color-background-hover)'};
  padding: 6px 12px;
  border-radius: 6px;
  color: ${(props) => (props.$primary ? 'var(--color-primary)' : 'var(--color-foreground-de-emp)')};
  font-weight: 600;
  border: ${(props) => (props.$primary ? '1px solid var(--color-primary)30' : 'none')};
`;

export const SampleText = styled.div<{
  $fontFamily?: string;
  $fontSize?: string;
  $lineHeight?: string;
  $fontWeight?: number | string;
  $letterSpacing?: string;
}>`
  font-family: ${(props) => props.$fontFamily};
  font-size: ${(props) => props.$fontSize};
  line-height: ${(props) => props.$lineHeight};
  font-weight: ${(props) => props.$fontWeight};
  letter-spacing: ${(props) => props.$letterSpacing};
  color: var(--color-foreground-emp);
  margin-bottom: 16px;
`;

export const FontFamilyReference = styled.div`
  font-size: 10px;
  color: var(--color-foreground);
  font-family: monospace;
  background: var(--color-background-secondary);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
  word-break: break-all;
`;

export const FamilyCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }
`;

export const FamilyHeader = styled.div`
  margin-bottom: 24px;
`;

export const FamilyTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const FamilyTitle = styled.h3`
  font-size: 24px;
  margin: 0;
  color: var(--color-primary);
  font-weight: bold;
`;

export const TokenCount = styled.span`
  background: var(--color-primary) 15;
  color: var(--color-primary);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

export const FamilyValue = styled.code`
  background: var(--color-background-selected);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 11px;
  color: var(--color-foreground-emp);
  font-family: monospace;
  word-break: break-all;
  display: block;
  border: 1px solid var(--color-primary) 30;
  margin-bottom: 16px;
`;

export const TokensLabel = styled.div`
  font-size: 12px;
  color: var(--color-foreground);
  margin-bottom: 8px;
  font-weight: 600;
`;

export const TokenChips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const TokenChip = styled.span`
  background: var(--color-background-hover);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
`;

export const PropertiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

export const PropertyCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }
`;

export const PropertyName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 12px;
`;

export const PropertyValue = styled.code<{ $isLong?: boolean }>`
  font-size: ${(props) => (props.$isLong ? '11px' : '16px')};
  color: var(--color-foreground-emp);
  background: var(--color-background-hover);
  padding: 10px 12px;
  border-radius: 6px;
  display: block;
  font-family: monospace;
  line-height: 1.6;
  word-break: break-word;
  overflow-wrap: break-word;
`;
