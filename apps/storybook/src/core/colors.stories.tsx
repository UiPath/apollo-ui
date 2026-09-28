import type { Meta, StoryObj } from '@storybook/react-vite';
import { Colors as ColorsTokens } from '@uipath/apollo-react/core';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SearchInput,
  SHADOW_SM,
  useCopyToClipboard,
} from './shared';

const meta = {
  title: 'Theme/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type ColorToken = { name: string; value: string };

// Helper to determine if a color is light or dark
function isLightColor(color: string): boolean {
  let r = 0,
    g = 0,
    b = 0,
    a = 1;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // #RGB
      r = parseInt(hex[0]! + hex[0]!, 16);
      g = parseInt(hex[1]! + hex[1]!, 16);
      b = parseInt(hex[2]! + hex[2]!, 16);
    } else if (hex.length === 4) {
      // #RGBA
      r = parseInt(hex[0]! + hex[0]!, 16);
      g = parseInt(hex[1]! + hex[1]!, 16);
      b = parseInt(hex[2]! + hex[2]!, 16);
      a = parseInt(hex[3]! + hex[3]!, 16) / 255;
    } else if (hex.length === 6) {
      // #RRGGBB
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      // #RRGGBBAA
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/[\d.]+/g);
    if (match) {
      r = parseInt(match[0]!, 10);
      g = parseInt(match[1]!, 10);
      b = parseInt(match[2]!, 10);
      if (match[3]) {
        a = parseFloat(match[3]);
      }
    }
  }

  // If alpha is very low, blend with white background
  if (a < 0.5) {
    r = Math.round(r * a + 255 * (1 - a));
    g = Math.round(g * a + 255 * (1 - a));
    b = Math.round(b * a + 255 * (1 - a));
  }

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140;
}

function ColorCard({
  name,
  colorValue,
  copied,
  onCopy,
}: {
  name: string;
  colorValue: string;
  copied: boolean;
  onCopy: (name: string, value: string) => void;
}) {
  const isLight = isLightColor(colorValue);
  // Fixed black/white text so swatch labels stay readable in any theme
  const textColor = isLight ? 'var(--color-black)' : 'var(--color-white)';
  const textShadow = isLight ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.5)';

  return (
    <button
      type="button"
      className="sb-core-lift"
      onClick={() => onCopy(name, colorValue)}
      title={`${name}\nClick to copy: ${colorValue}`}
      style={{
        background: colorValue,
        borderRadius: 6,
        padding: 8,
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        minHeight: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        textAlign: 'left',
        font: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 'bold',
          color: textColor,
          textShadow,
          marginBottom: 6,
          wordBreak: 'break-word',
        }}
      >
        {name.replace('Color', '')}
      </div>
      <div
        style={{
          fontSize: 9,
          fontFamily: 'monospace',
          color: textColor,
          textShadow,
          background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.3)',
          padding: '3px 5px',
          borderRadius: 3,
        }}
      >
        {copied ? 'Copied!' : colorValue}
      </div>
    </button>
  );
}

function GroupHeader({ title, count }: { title: string; count: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          fontSize: 18,
          margin: 0,
          color: 'var(--color-foreground-emp)',
          fontWeight: 'bold',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-foreground)',
          background: 'var(--color-background-hover)',
          padding: '4px 10px',
          borderRadius: 12,
        }}
      >
        {count}
      </div>
    </div>
  );
}

const colorGroupStyle = {
  background: 'var(--color-background)',
  border: '2px solid var(--color-border)',
  borderRadius: 12,
  padding: 20,
  boxShadow: SHADOW_SM,
} as const;

const sectionContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
} as const;

const sectionHeaderStyle = {
  fontSize: 24,
  marginBottom: 20,
  color: 'var(--color-primary)',
  borderBottom: '2px solid var(--color-border)',
  paddingBottom: 12,
} as const;

const sectionDescriptionStyle = {
  color: 'var(--color-foreground-de-emp)',
  fontSize: 14,
  marginBottom: 24,
} as const;

function ColorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { copied, copy } = useCopyToClipboard();

  // Use the ColorsTokens namespace which contains only color tokens
  const colors: ColorToken[] = Object.entries(ColorsTokens)
    .filter(([key, value]) => key.startsWith('Color') && typeof value === 'string')
    .map(([name, value]) => ({ name, value: value as string }));

  // Separate colors into Semantic and Base categories
  const semanticColors: ColorToken[] = [];
  const baseColors: ColorToken[] = [];

  colors.forEach((color) => {
    // Check if color has semantic variants (Dark, Light, DarkHc, LightHc)
    if (color.name.match(/(Dark|Light|DarkHc|LightHc)$/)) {
      semanticColors.push(color);
    } else {
      baseColors.push(color);
    }
  });

  // Group semantic colors by base name and variant
  const semanticGroups = semanticColors.reduce(
    (acc, color) => {
      const match = color.name.match(
        /^Color([A-Z][a-z]+(?:[A-Z][a-z]+)*?)(Dark|Light|DarkHc|LightHc)$/
      );
      if (match?.[1] && match[2]) {
        const baseName = match[1];
        const variant = match[2];

        if (!acc[baseName]) {
          acc[baseName] = {};
        }
        acc[baseName][variant] = color.value;
      }
      return acc;
    },
    {} as Record<string, Record<string, string>>
  );

  // Group base colors by prefix (e.g., ColorBlue, ColorRed, ColorWarning)
  const baseColorGroups = baseColors.reduce(
    (acc, color) => {
      // Extract the main color category (e.g., "Blue", "Red", "Warning")
      const match = color.name.match(/^Color([A-Z][a-z]+)/);
      if (match?.[1]) {
        const category = match[1];
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(color);
      }
      return acc;
    },
    {} as Record<string, ColorToken[]>
  );

  const variantOrder = ['Dark', 'DarkHc', 'Light', 'LightHc'];

  // Filter groups and individual colors based on search term (searches both name and hex values)
  const searchLower = searchTerm.toLowerCase();

  const filteredSemanticGroups: Array<[string, Record<string, string>]> = !searchTerm
    ? Object.entries(semanticGroups)
    : Object.entries(semanticGroups)
        .map(([groupName, variants]): [string, Record<string, string>] => {
          // Filter variants within this group
          const filteredVariants = Object.entries(variants).filter(([variant, value]) => {
            const fullName = `${groupName}${variant}`.toLowerCase();
            return fullName.includes(searchLower) || value.toLowerCase().includes(searchLower);
          });
          return [groupName, Object.fromEntries(filteredVariants)];
        })
        .filter(([, variants]) => Object.keys(variants).length > 0); // Only keep groups with matching variants

  const filteredBaseColorGroups: Array<[string, ColorToken[]]> = !searchTerm
    ? Object.entries(baseColorGroups)
    : Object.entries(baseColorGroups)
        .map(([category, categoryColors]): [string, ColorToken[]] => {
          // Filter colors within this category
          const filteredColors = categoryColors.filter(
            (color) =>
              color.name.toLowerCase().includes(searchLower) ||
              color.value.toLowerCase().includes(searchLower)
          );
          return [category, filteredColors];
        })
        .filter(([, categoryColors]) => categoryColors.length > 0); // Only keep categories with matching colors

  // Count filtered colors
  const filteredSemanticCount = filteredSemanticGroups.reduce(
    (acc, [, variants]) => acc + Object.keys(variants).length,
    0
  );
  const filteredBaseCount = filteredBaseColorGroups.reduce(
    (acc, [, categoryColors]) => acc + categoryColors.length,
    0
  );

  return (
    <PageContainer>
      <PageTitle>Colors</PageTitle>
      <PageDescription>
        Complete color palette with semantic naming ({colors.length} tokens)
      </PageDescription>

      <div style={{ marginBottom: 40 }}>
        <SearchInput
          placeholder="Search colors by token name or hex"
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {searchTerm && filteredSemanticCount === 0 && filteredBaseCount === 0 && (
        <div
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-foreground)' }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              marginBottom: 8,
              color: 'var(--color-foreground-de-emp)',
            }}
          >
            No results found
          </div>
          <div style={{ fontSize: 16 }}>Try searching for a different color name or hex value</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {filteredSemanticCount > 0 && (
          <section>
            <h2 style={sectionHeaderStyle}>Semantic Colors</h2>
            <p style={sectionDescriptionStyle}>
              Theme-aware colors with dark and light variants (
              {searchTerm
                ? `${filteredSemanticCount}/${semanticColors.length}`
                : filteredSemanticCount}{' '}
              token{filteredSemanticCount !== 1 ? 's' : ''})
            </p>
            <div style={sectionContainerStyle}>
              {filteredSemanticGroups
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, variants]) => {
                  const sortedVariants = Object.entries(variants).sort(([a], [b]) => {
                    const aIndex = variantOrder.indexOf(a);
                    const bIndex = variantOrder.indexOf(b);
                    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                  });

                  return (
                    <div key={groupName} style={colorGroupStyle}>
                      <GroupHeader
                        title={groupName}
                        count={`${sortedVariants.length} variant${sortedVariants.length > 1 ? 's' : ''}`}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                          gap: 8,
                        }}
                      >
                        {sortedVariants.map(([variant, colorValue]) => {
                          const name = `${groupName}${variant}`;
                          return (
                            <ColorCard
                              key={name}
                              name={name}
                              colorValue={colorValue}
                              copied={copied === name}
                              onCopy={copy}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {filteredBaseCount > 0 && (
          <section>
            <h2 style={sectionHeaderStyle}>Base Colors</h2>
            <p style={sectionDescriptionStyle}>
              Foundation color palette (
              {searchTerm ? `${filteredBaseCount}/${baseColors.length}` : filteredBaseCount} token
              {filteredBaseCount !== 1 ? 's' : ''})
            </p>
            <div style={sectionContainerStyle}>
              {filteredBaseColorGroups
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, categoryColors]) => (
                  <div key={category} style={colorGroupStyle}>
                    <GroupHeader
                      title={category}
                      count={`${categoryColors.length} color${categoryColors.length > 1 ? 's' : ''}`}
                    />
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 8,
                      }}
                    >
                      {[...categoryColors]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((color) => (
                          <ColorCard
                            key={color.name}
                            name={color.name}
                            colorValue={color.value}
                            copied={copied === color.name}
                            onCopy={copy}
                          />
                        ))}
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
  render: () => <ColorsPage />,
};
