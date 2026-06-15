import type { Meta, StoryObj } from '@storybook/react-vite';
import { Border, Stroke } from '@uipath/apollo-react/core';
import type { ReactNode } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
  SHADOW_SM,
  TokenName,
} from './shared';

const meta = {
  title: 'Theme/Borders',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 24,
} as const;

function BorderCard({ isDark, children }: { isDark?: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        background: isDark ? 'var(--color-background)' : 'var(--color-background-secondary)',
        border: '2px solid var(--color-border)',
        borderRadius: 12,
        padding: 24,
        boxShadow: SHADOW_SM,
      }}
    >
      {children}
    </div>
  );
}

function StrokeLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--color-foreground-de-emp)',
        marginBottom: 8,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

function BordersPage() {
  // Use the Border namespace which contains only border tokens
  const borders = Object.entries(Border).map(([name, value]) => ({
    name,
    value: value as string,
  }));

  // Use the Stroke namespace which contains only stroke tokens
  const strokes = Object.entries(Stroke).map(([name, value]) => ({
    name,
    value: value as string,
  }));

  return (
    <PageContainer>
      <PageTitle>Borders & Strokes</PageTitle>
      <PageDescription>
        Border radii, widths, and stroke styles ({borders.length + strokes.length} tokens)
      </PageDescription>

      <section style={{ marginBottom: 60 }}>
        <SectionHeader>Border Tokens</SectionHeader>
        <SectionDescription>Border radii and widths</SectionDescription>
        <div style={gridStyle}>
          {borders.map((border) => {
            const isRadius = border.name.toLowerCase().includes('radius');
            const isWidth = border.name.toLowerCase().includes('width');
            const isThick = border.name.toLowerCase().includes('thick');
            const isSemanticBorder =
              !isRadius && !isWidth && !isThick && border.value.includes('solid');
            const isDark = border.name.toLowerCase().includes('dark');

            return (
              <BorderCard key={border.name} isDark={isDark && isSemanticBorder}>
                <div style={{ marginBottom: 16 }}>
                  <TokenName>{border.name}</TokenName>
                  <code style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
                    {border.value}
                  </code>
                </div>

                {isRadius && (
                  <div
                    style={{
                      width: '100%',
                      height: 100,
                      border: '3px solid var(--color-primary)',
                      borderRadius: border.value,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      fontWeight: 'bold',
                      fontSize: 14,
                      background: 'var(--color-background)',
                    }}
                  >
                    Border Radius
                  </div>
                )}

                {(isWidth || isThick) && (
                  <div
                    style={{
                      width: '100%',
                      height: 80,
                      border: `${border.value} solid var(--color-primary)`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      fontWeight: 'bold',
                      background: 'var(--color-background)',
                    }}
                  >
                    Border Width
                  </div>
                )}

                {isSemanticBorder && (
                  <div
                    style={{
                      width: '100%',
                      padding: 20,
                      border: border.value,
                      borderRadius: 8,
                      background: 'var(--color-background)',
                      fontSize: 14,
                      color: isDark ? 'var(--color-foreground)' : 'var(--color-foreground-emp)',
                      lineHeight: 1.6,
                      minHeight: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Card with {border.name}
                  </div>
                )}

                {!isRadius && !isWidth && !isThick && !isSemanticBorder && (
                  <div
                    style={{
                      padding: 20,
                      background: 'var(--color-background-hover)',
                      borderRadius: 8,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      color: 'var(--color-foreground-emp)',
                      textAlign: 'center',
                    }}
                  >
                    {border.value}
                  </div>
                )}
              </BorderCard>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader>Stroke Tokens</SectionHeader>
        <SectionDescription>SVG stroke widths</SectionDescription>
        <div style={gridStyle}>
          {strokes.map((stroke) => (
            <BorderCard key={stroke.name}>
              <div style={{ marginBottom: 16 }}>
                <TokenName>{stroke.name}</TokenName>
                <code style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
                  {stroke.value}
                </code>
              </div>

              <div
                style={{
                  background: 'var(--color-background)',
                  padding: 20,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div>
                  <StrokeLabel>SVG Line</StrokeLabel>
                  <svg width="100%" height="40" style={{ display: 'block' }} aria-hidden="true">
                    <line
                      x1="0"
                      y1="20"
                      x2="100%"
                      y2="20"
                      stroke="var(--color-primary)"
                      strokeWidth={stroke.value}
                    />
                  </svg>
                </div>
                <div>
                  <StrokeLabel>SVG Circle</StrokeLabel>
                  <svg width="100%" height="60" style={{ display: 'block' }} aria-hidden="true">
                    <circle
                      cx="50%"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth={stroke.value}
                    />
                  </svg>
                </div>
              </div>
            </BorderCard>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <BordersPage />,
};
