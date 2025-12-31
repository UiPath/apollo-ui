import { Padding as PaddingTokens, Spacing as SpacingTokens } from '@uipath/apollo-react/core';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../components/SharedStyles';
import {
  Grid,
  PaddingDemo,
  PaddingInner,
  PaddingOuter,
  Section,
  SizeIndicator,
  SizeMarker,
  SpacingBox,
  SpacingDemo,
  TokenCard,
  TokenInfo,
  TokenName,
  TokenValue,
} from './Spacing.styles';

export function Spacing() {
  // Use the Spacing namespace which contains only spacing tokens
  const spacingTokens = Object.entries(SpacingTokens)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  // Use the Padding namespace which contains only padding tokens
  const paddingTokens = Object.entries(PaddingTokens)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  const renderSpacingDemo = (token: { name: string; value: string }) => (
    <TokenCard key={token.name}>
      <TokenInfo>
        <TokenName>{token.name}</TokenName>
        <TokenValue>{token.value}</TokenValue>
      </TokenInfo>

      <SpacingDemo $gap={token.value}>
        <SpacingBox $color={'var(--color-primary)'} />
        <SpacingBox $color="var(--color-secondary)" />
      </SpacingDemo>

      <SizeIndicator $size={token.value}>
        <SizeMarker $left={token.value} />
      </SizeIndicator>
    </TokenCard>
  );

  const renderPaddingDemo = (token: { name: string; value: string }) => (
    <TokenCard key={token.name}>
      <TokenInfo>
        <TokenName>{token.name}</TokenName>
        <TokenValue>{token.value}</TokenValue>
      </TokenInfo>

      <PaddingDemo>
        <PaddingOuter $padding={token.value}>
          <PaddingInner>Content</PaddingInner>
        </PaddingOuter>
      </PaddingDemo>
    </TokenCard>
  );

  return (
    <PageContainer>
      <PageTitle>Spacing & Padding</PageTitle>
      <PageDescription>
        Consistent spacing scale for layouts ({spacingTokens.length + paddingTokens.length} tokens)
      </PageDescription>

      <Section $marginBottom="60px">
        <SectionHeader>Spacing Tokens</SectionHeader>
        <SectionDescription>Use these for margins and gaps between elements</SectionDescription>
        <Grid>{spacingTokens.map(renderSpacingDemo)}</Grid>
      </Section>

      <Section>
        <SectionHeader>Padding Tokens</SectionHeader>
        <SectionDescription>Use these for internal spacing within components</SectionDescription>
        <Grid>{paddingTokens.map(renderPaddingDemo)}</Grid>
      </Section>
    </PageContainer>
  );
}
