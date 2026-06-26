import type { Meta, StoryObj } from '@storybook/react-vite';
import { Padding as PaddingTokens, Spacing as SpacingTokens } from '@uipath/apollo-react/core';
import {
  COLOR_SECONDARY,
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
  SHADOW_SM,
  TokenName,
  TokenValue,
} from './shared';

const meta = {
  title: 'Theme/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type SizeToken = { name: string; value: string };

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 20,
} as const;

const tokenCardStyle = {
  background: 'var(--color-background)',
  border: '2px solid var(--color-border)',
  borderRadius: 12,
  padding: 20,
  boxShadow: SHADOW_SM,
} as const;

function SpacingDemoCard({ token }: { token: SizeToken }) {
  return (
    <div style={tokenCardStyle}>
      <div style={{ marginBottom: 16 }}>
        <TokenName>{token.name}</TokenName>
        <TokenValue>{token.value}</TokenValue>
      </div>

      {/* Two boxes separated by the spacing value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: token.value,
          background: 'var(--color-background-hover)',
          padding: 20,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: 'var(--color-primary)',
            borderRadius: 6,
          }}
        />
        <div style={{ width: 40, height: 40, background: COLOR_SECONDARY, borderRadius: 6 }} />
      </div>

      {/* Size indicator bar with marker at the token value */}
      <div
        style={{
          marginTop: 12,
          height: 20,
          background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${token.value}, transparent ${token.value})`,
          borderRadius: 4,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: token.value,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 2,
            height: 30,
            background: 'var(--color-foreground-emp)',
          }}
        />
      </div>
    </div>
  );
}

function PaddingDemoCard({ token }: { token: SizeToken }) {
  return (
    <div style={tokenCardStyle}>
      <div style={{ marginBottom: 16 }}>
        <TokenName>{token.name}</TokenName>
        <TokenValue>{token.value}</TokenValue>
      </div>

      <div
        style={{
          background: 'var(--color-background-hover)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--color-background-selected)',
            padding: token.value,
            border: '2px dashed var(--color-primary)',
          }}
        >
          <div
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-background)',
              padding: 12,
              borderRadius: 6,
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            Content
          </div>
        </div>
      </div>
    </div>
  );
}

function SpacingPage() {
  // Use the Spacing namespace which contains only spacing tokens
  const spacingTokens: SizeToken[] = Object.entries(SpacingTokens)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  // Use the Padding namespace which contains only padding tokens
  const paddingTokens: SizeToken[] = Object.entries(PaddingTokens)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  return (
    <PageContainer>
      <PageTitle>Spacing & Padding</PageTitle>
      <PageDescription>
        Consistent spacing scale for layouts ({spacingTokens.length + paddingTokens.length} tokens)
      </PageDescription>

      <section style={{ marginBottom: 60 }}>
        <SectionHeader>Spacing Tokens</SectionHeader>
        <SectionDescription>Use these for margins and gaps between elements</SectionDescription>
        <div style={gridStyle}>
          {spacingTokens.map((token) => (
            <SpacingDemoCard key={token.name} token={token} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>Padding Tokens</SectionHeader>
        <SectionDescription>Use these for internal spacing within components</SectionDescription>
        <div style={gridStyle}>
          {paddingTokens.map((token) => (
            <PaddingDemoCard key={token.name} token={token} />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <SpacingPage />,
};
