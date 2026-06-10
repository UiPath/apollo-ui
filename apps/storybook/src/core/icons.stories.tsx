import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from '@uipath/apollo-react/core';
import * as ApolloIcons from '@uipath/apollo-react/icons';
import type React from 'react';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  PRIMARY_GRADIENT,
  SectionDescription,
  SectionHeader,
  SHADOW_SM,
  useCopyToClipboard,
} from './shared';

const meta = {
  title: 'Icons',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Pretty-print serialized SVG markup before copying it
function formatXml(xml: string): string {
  const PADDING = '  '; // 2 spaces for indentation
  const reg = /(>)(<)(\/*)/g;
  let pad = 0;

  const broken = xml.replace(reg, '$1\n$2$3');

  return broken
    .split('\n')
    .map((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      pad += indent;
      return PADDING.repeat(pad - indent) + node;
    })
    .join('\n');
}

function IconsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { copied, copy } = useCopyToClipboard();

  // Icon sizing tokens from Apollo Core
  const sizeTokens = Object.entries(Icon)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  // Filter icon names based on search
  const filteredIconNames = searchTerm
    ? iconNames.filter(
        (name) =>
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          name
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : iconNames;

  const handleCopySvg = (e: React.MouseEvent<HTMLButtonElement>, iconName: string) => {
    const svgElement = e.currentTarget.querySelector('svg');
    if (svgElement) {
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Serialize and pretty-print the SVG markup
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      copy(iconName, formatXml(svgString));
    }
  };

  return (
    <PageContainer>
      <PageTitle>Icons</PageTitle>
      <PageDescription>
        Complete Apollo icon library with {iconNames.length} icons and sizing tokens
      </PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        {/* Icon Browser */}
        <section>
          <SectionHeader>Icon Library ({filteredIconNames.length} icons)</SectionHeader>
          <SectionDescription>
            Search and browse all available icons in the Apollo Design System
          </SectionDescription>

          <input
            type="text"
            placeholder="Search icons... (e.g., 'arrow', 'alert', 'user')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: 16,
              border: '2px solid var(--color-border)',
              borderRadius: 12,
              background: 'var(--color-background)',
              color: 'var(--color-foreground-emp)',
              marginBottom: 32,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: 8,
              marginTop: 24,
            }}
          >
            {filteredIconNames.map((iconName) => {
              const IconComponent = (
                ApolloIcons as Record<
                  string,
                  React.ComponentType<{
                    size?: string | number;
                    color?: string;
                  }>
                >
              )[iconName];
              if (!IconComponent) return null;

              return (
                <button
                  type="button"
                  key={iconName}
                  className="sb-core-icon-card"
                  onClick={(e) => handleCopySvg(e, iconName)}
                  title={`Click to copy SVG: ${iconName}`}
                  style={{
                    background: 'var(--color-background)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    minHeight: 110,
                    color: 'var(--color-foreground)',
                    font: 'inherit',
                  }}
                >
                  <IconComponent size={48} color="var(--color-foreground)" />
                  <div
                    style={{
                      fontSize: 10,
                      color:
                        copied === iconName
                          ? 'var(--color-primary)'
                          : 'var(--color-foreground-de-emp)',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontWeight: copied === iconName ? 'bold' : 'normal',
                    }}
                  >
                    {copied === iconName ? 'Copied!' : iconName}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredIconNames.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: 'var(--color-foreground-de-emp)',
                fontSize: 16,
              }}
            >
              No icons found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </section>

        {/* Icon Sizing Tokens */}
        <section>
          <SectionHeader>Icon Sizing Tokens</SectionHeader>
          <SectionDescription>
            Standard icon sizes for consistent spacing ({sizeTokens.length} tokens)
          </SectionDescription>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {sizeTokens.map((token) => (
              <div
                key={token.name}
                style={{
                  background: 'var(--color-background)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 32,
                  boxShadow: SHADOW_SM,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      marginBottom: 8,
                    }}
                  >
                    {token.name}
                  </div>
                  <code style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
                    {token.value}
                  </code>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: 100,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: token.value,
                      height: token.value,
                      background: PRIMARY_GRADIENT,
                      borderRadius: '50%',
                      border: '2px solid var(--color-border)',
                      boxShadow: SHADOW_SM,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16,
                    fontSize: 12,
                    color: 'var(--color-foreground)',
                  }}
                >
                  <div>W: {token.value}</div>
                  <div>H: {token.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <IconsPage />,
};
