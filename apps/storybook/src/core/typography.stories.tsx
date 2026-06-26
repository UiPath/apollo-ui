import type { Meta, StoryObj } from '@storybook/react-vite';
import { FontFamily, Typography } from '@uipath/apollo-react/core';
import type { ReactNode } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
  SHADOW_SM,
} from './shared';

const meta = {
  title: 'Theme/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type FontToken = {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: number | string;
  letterSpacing?: string;
};

type Token = { name: string; value: string | FontToken };

function Badge({ primary, children }: { primary?: boolean; children: ReactNode }) {
  return (
    <code
      style={{
        background: primary ? 'var(--color-background-selected)' : 'var(--color-background-hover)',
        padding: '6px 12px',
        borderRadius: 6,
        color: primary ? 'var(--color-primary)' : 'var(--color-foreground-de-emp)',
        fontWeight: 600,
        border: primary ? '1px solid var(--color-primary)' : 'none',
      }}
    >
      {children}
    </code>
  );
}

const cardStyle = {
  background: 'var(--color-background)',
  border: '2px solid var(--color-border)',
  borderRadius: 16,
  boxShadow: SHADOW_SM,
  position: 'relative',
  overflow: 'hidden',
} as const;

function TypographyPage() {
  // Use the FontFamily namespace which contains font family tokens
  // (string values only — FontWeight* numeric tokens are listed separately below)
  const fontFamilyTokens: Token[] = Object.entries(FontFamily).map(([name, value]) => ({
    name,
    value: value as string | FontToken,
  }));

  // Use the Typography namespace which contains typography tokens (objects).
  // Filter out non-token exports (HeaderVariants map, FontVariantToken enum).
  const typographyTokens = Object.entries(Typography)
    .filter(
      ([, value]) =>
        typeof value === 'object' &&
        value !== null &&
        ('fontSize' in value || 'fontFamily' in value)
    )
    .map(([name, value]) => ({ name, value: value as FontToken }));

  // Combine all font tokens for total count
  const fontTokens: Token[] = [...fontFamilyTokens, ...typographyTokens];

  const realisticSamples = [
    'Design systems enable teams to build consistent experiences',
    'Typography creates hierarchy and improves readability',
    'Choose fonts that reflect your brand personality',
  ];

  // Group all tokens by their font family value (deduplicate)
  const tokensByFamily = fontTokens.reduce(
    (acc, token) => {
      let familyValue: string | undefined;

      if (typeof token.value === 'string' && !token.name.toLowerCase().includes('weight')) {
        // String-valued FontFamily tokens (FontNormal, FontTitle, FontMono) are family stacks
        familyValue = token.value;
      } else if (typeof token.value === 'object' && token.value.fontFamily) {
        familyValue = token.value.fontFamily;
      }

      if (familyValue) {
        const normalizedFamily = familyValue.trim();

        if (!acc[normalizedFamily]) {
          acc[normalizedFamily] = {
            tokens: [],
            tokenNames: new Set<string>(),
          };
        }
        if (!acc[normalizedFamily].tokenNames.has(token.name)) {
          acc[normalizedFamily].tokens.push(token);
          acc[normalizedFamily].tokenNames.add(token.name);
        }
      }

      return acc;
    },
    {} as Record<string, { tokens: Token[]; tokenNames: Set<string> }>
  );

  // Filter to only show families that have an actual font-family token (string value)
  const uniqueFamilies = Object.entries(tokensByFamily).reduce(
    (acc, [family, data]) => {
      const hasFamilyToken = data.tokens.some((t) => typeof t.value === 'string');
      if (hasFamilyToken) {
        acc[family] = data;
      }
      return acc;
    },
    {} as Record<string, { tokens: Token[]; tokenNames: Set<string> }>
  );

  // Sort typography tokens by font size for visual scale
  const sortedTypography = [...typographyTokens].sort((a, b) => {
    const sizeA = parseFloat(a.value.fontSize || '0');
    const sizeB = parseFloat(b.value.fontSize || '0');
    return sizeB - sizeA;
  });

  return (
    <PageContainer>
      <PageTitle>Typography</PageTitle>
      <PageDescription>Complete typography system ({fontTokens.length} tokens)</PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        {/* Typography Scale - Visual Hierarchy */}
        {sortedTypography.length > 0 && (
          <section>
            <SectionHeader>Type Scale</SectionHeader>
            <SectionDescription>Visual hierarchy from largest to smallest</SectionDescription>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
                gap: 24,
              }}
            >
              {sortedTypography.map((token, index) => {
                const fontStyle = token.value;
                const sampleIndex = index % realisticSamples.length;

                return (
                  <div
                    key={token.name}
                    className="sb-core-card"
                    style={{ ...cardStyle, padding: 32 }}
                  >
                    {/* Decorative corner */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 100,
                        height: 100,
                        background:
                          'linear-gradient(135deg, var(--color-primary-subtle) 0%, transparent 100%)',
                        borderRadius: '0 16px 0 100%',
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 20,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 16,
                          margin: 0,
                          color: 'var(--color-primary)',
                          fontWeight: 'bold',
                        }}
                      >
                        {token.name}
                      </h3>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 20,
                        fontSize: 11,
                      }}
                    >
                      {fontStyle.fontSize && <Badge primary>{fontStyle.fontSize}</Badge>}
                      {fontStyle.fontWeight && <Badge>Weight: {fontStyle.fontWeight}</Badge>}
                      {fontStyle.lineHeight && <Badge>Line: {fontStyle.lineHeight}</Badge>}
                      {fontStyle.letterSpacing && fontStyle.letterSpacing !== '0' && (
                        <Badge>Spacing: {fontStyle.letterSpacing}</Badge>
                      )}
                    </div>

                    <div
                      style={{
                        fontFamily: fontStyle.fontFamily,
                        fontSize: fontStyle.fontSize,
                        lineHeight: fontStyle.lineHeight,
                        fontWeight: fontStyle.fontWeight,
                        letterSpacing: fontStyle.letterSpacing,
                        color: 'var(--color-foreground-emp)',
                        marginBottom: 16,
                      }}
                    >
                      {realisticSamples[sampleIndex]}
                    </div>

                    {fontStyle.fontFamily && (
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--color-foreground)',
                          fontFamily: 'monospace',
                          background: 'var(--color-background-secondary)',
                          padding: '8px 12px',
                          borderRadius: 6,
                          borderLeft: '3px solid var(--color-primary)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {fontStyle.fontFamily}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Font Family Showcase */}
        {Object.keys(uniqueFamilies).length > 0 && (
          <section>
            <SectionHeader>Font Families</SectionHeader>
            <SectionDescription>
              Core typefaces used throughout the system with all related tokens
            </SectionDescription>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {Object.entries(uniqueFamilies).map(([family, { tokens }]) => (
                <div key={family} className="sb-core-card" style={{ ...cardStyle, padding: 40 }}>
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 24,
                          margin: 0,
                          color: 'var(--color-primary)',
                          fontWeight: 'bold',
                        }}
                      >
                        {family.split(',')[0]?.trim().replace(/['"]/g, '')}
                      </h3>
                      <span
                        style={{
                          background: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        {tokens.length} token{tokens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <code
                      style={{
                        background: 'var(--color-background-selected)',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 11,
                        color: 'var(--color-foreground-emp)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        display: 'block',
                        border: '1px solid var(--color-border)',
                        marginBottom: 16,
                      }}
                    >
                      {family}
                    </code>

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-foreground)',
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Tokens using this family:
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tokens.map((t) => (
                          <span
                            key={t.name}
                            style={{
                              background: 'var(--color-background-hover)',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 11,
                              color: 'var(--color-foreground-de-emp)',
                              fontWeight: 600,
                            }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <TypographyPage />,
};
