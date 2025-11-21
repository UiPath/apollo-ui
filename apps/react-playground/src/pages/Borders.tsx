import * as ApolloCore from '@uipath/apollo-react/core';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../components/SharedStyles';
import {
  BorderCard,
  GenericDisplay,
  Grid,
  RadiusDemo,
  Section,
  SemanticBorderDemo,
  StrokeDemo,
  StrokeLabel,
  StrokeSection,
  TokenInfo,
  TokenName,
  TokenValue,
  WidthDemo,
} from './Borders.styles';

export function Borders() {
  const borders = Object.entries(ApolloCore)
    .filter(([key, value]) => key.startsWith('Border') && typeof value === 'string')
    .map(([name, value]) => ({ name, value: value as unknown as string }));

  const strokes = Object.entries(ApolloCore)
    .filter(([key, value]) => key.startsWith('Stroke') && typeof value === 'string')
    .map(([name, value]) => ({ name, value: value as unknown as string }));

  return (
    <PageContainer>
      <PageTitle>Borders & Strokes</PageTitle>
      <PageDescription>
        Border radii, widths, and stroke styles ({borders.length + strokes.length} tokens)
      </PageDescription>

      <Section $marginBottom="60px">
        <SectionHeader>Border Tokens</SectionHeader>
        <SectionDescription>Border radii and widths</SectionDescription>
        <Grid>
          {borders.map((border) => {
            const isRadius = border.name.toLowerCase().includes('radius');
            const isWidth = border.name.toLowerCase().includes('width');
            const isThick = border.name.toLowerCase().includes('thick');
            const isSemanticBorder =
              !isRadius && !isWidth && !isThick && border.value.includes('solid');
            const isDark = border.name.toLowerCase().includes('dark');

            return (
              <BorderCard key={border.name} $isDark={isDark && isSemanticBorder}>
                <TokenInfo>
                  <TokenName>{border.name}</TokenName>
                  <TokenValue $isDark={isDark && isSemanticBorder}>{border.value}</TokenValue>
                </TokenInfo>

                {isRadius && <RadiusDemo $radius={border.value}>Border Radius</RadiusDemo>}

                {(isWidth || isThick) && <WidthDemo $width={border.value}>Border Width</WidthDemo>}

                {isSemanticBorder && (
                  <SemanticBorderDemo $border={border.value} $isDark={isDark}>
                    Card with {border.name}
                  </SemanticBorderDemo>
                )}

                {!isRadius && !isWidth && !isThick && !isSemanticBorder && (
                  <GenericDisplay>{border.value}</GenericDisplay>
                )}
              </BorderCard>
            );
          })}
        </Grid>
      </Section>

      <Section>
        <SectionHeader>Stroke Tokens</SectionHeader>
        <SectionDescription>SVG stroke widths</SectionDescription>
        <Grid>
          {strokes.map((stroke) => (
            <BorderCard key={stroke.name}>
              <TokenInfo>
                <TokenName>{stroke.name}</TokenName>
                <TokenValue>{stroke.value}</TokenValue>
              </TokenInfo>

              <StrokeDemo>
                <StrokeSection>
                  <StrokeLabel>SVG Line</StrokeLabel>
                  <svg width="100%" height="40" style={{ display: 'block' }}>
                    <line
                      x1="0"
                      y1="20"
                      x2="100%"
                      y2="20"
                      stroke={'var(--color-primary)'}
                      strokeWidth={stroke.value}
                    />
                  </svg>
                </StrokeSection>
                <StrokeSection>
                  <StrokeLabel>SVG Circle</StrokeLabel>
                  <svg width="100%" height="60" style={{ display: 'block' }}>
                    <circle
                      cx="50%"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke={'var(--color-primary)'}
                      strokeWidth={stroke.value}
                    />
                  </svg>
                </StrokeSection>
              </StrokeDemo>
            </BorderCard>
          ))}
        </Grid>
      </Section>
    </PageContainer>
  );
}
