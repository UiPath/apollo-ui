import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { PageContainer, SearchInput } from './shared';

const meta = {
  title: 'Theme/CSS Variables',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Subtle row divider (was --color-border-subtle in the playground)
const BORDER_SUBTLE = 'rgba(128, 128, 128, 0.2)';

// Helper function to detect if a value contains a color
function isColorValue(value: string): boolean {
  if (!value) return false;

  // Check for hex colors (3, 4, 6, or 8 digits for alpha support)
  if (value.match(/#[A-Fa-f0-9]{8}|#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{4}|#[A-Fa-f0-9]{3}/)) return true;

  // Check for rgb/rgba
  if (value.includes('rgb')) return true;

  // Check for hsl/hsla
  if (value.includes('hsl')) return true;

  // Check for named colors (common ones) - must be standalone word
  const namedColors = [
    'transparent',
    'black',
    'white',
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
    'purple',
    'pink',
    'gray',
    'grey',
    'brown',
    'cyan',
    'magenta',
    'lime',
    'navy',
    'teal',
    'aqua',
    'silver',
    'maroon',
    'olive',
    'fuchsia',
  ];
  const words = value.toLowerCase().split(/\s+/);
  if (words.some((word) => namedColors.includes(word))) return true;

  return false;
}

// Helper function to extract all colors with their positions from a value
function extractColorsWithPositions(
  value: string
): Array<{ color: string; start: number; end: number }> {
  const results: Array<{ color: string; start: number; end: number }> = [];

  // Hex colors (8, 6, 4, or 3 digits — longer patterns first to avoid partial matches),
  // then rgb/rgba, then hsl/hsla
  const colorRegexes = [
    /#[A-Fa-f0-9]{8}|#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{4}|#[A-Fa-f0-9]{3}/g,
    /rgba?\([^)]+\)/g,
    /hsla?\([^)]+\)/g,
  ];

  for (const regex of colorRegexes) {
    for (const match of value.matchAll(regex)) {
      results.push({
        color: match[0],
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }
  }

  // Sort by position
  results.sort((a, b) => a.start - b.start);

  return results;
}

function CssVariablesPage() {
  const [cssVars, setCssVars] = useState<Array<{ name: string; value: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allCssVars: Record<string, string> = {};

    // Computed styles from <html> and <body> (body carries the Storybook theme class,
    // so reading it captures theme-resolved values)
    for (const element of [document.documentElement, document.body]) {
      const styles = getComputedStyle(element);
      Array.from(styles).forEach((prop) => {
        if (prop.startsWith('--')) {
          allCssVars[prop] = styles.getPropertyValue(prop).trim();
        }
      });
    }

    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules).forEach((rule) => {
            if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
              const style = rule.style;
              Array.from(style).forEach((prop) => {
                if (prop.startsWith('--')) {
                  allCssVars[prop] = style.getPropertyValue(prop).trim();
                }
              });
            }
          });
        } catch {
          // Cross-origin stylesheet, skip
        }
      });
    } catch (e) {
      console.warn('Could not read stylesheets:', e);
    }

    const varsArray = Object.entries(allCssVars)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCssVars(varsArray);
  }, []);

  const filteredVars = cssVars.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <h1 style={{ fontSize: 36, marginBottom: 12, color: 'var(--color-foreground-emp)' }}>
        CSS Custom Properties
      </h1>
      <p style={{ color: 'var(--color-foreground-de-emp)', marginBottom: 30, fontSize: 16 }}>
        All CSS variables available from the design system ({cssVars.length} total)
      </p>

      <div style={{ marginBottom: 30 }}>
        <SearchInput
          placeholder="Search variables..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: 'none' }}
        />
      </div>

      <div
        style={{
          background: 'var(--color-background)',
          borderRadius: 12,
          border: '2px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            padding: '16px 20px',
            background: 'var(--color-background-secondary)',
            fontWeight: 'bold',
            borderBottom: '2px solid var(--color-border)',
          }}
        >
          <div>Variable Name</div>
          <div>Value</div>
        </div>
        <div style={{ maxHeight: 600, overflow: 'auto' }}>
          {filteredVars.map((variable, index) => {
            const hasColor = isColorValue(variable.value);
            const colorPositions = hasColor ? extractColorsWithPositions(variable.value) : [];

            // Build an array of text parts and color swatches
            const parts: Array<{ type: 'text' | 'color'; content: string }> = [];

            if (colorPositions.length > 0) {
              let lastIndex = 0;

              colorPositions.forEach(({ color, start, end }) => {
                // Add text before the color
                if (start > lastIndex) {
                  parts.push({
                    type: 'text',
                    content: variable.value.substring(lastIndex, start),
                  });
                }
                // Add the color swatch
                parts.push({ type: 'color', content: color });
                // Add the color text
                parts.push({ type: 'text', content: color });
                // Update last index
                lastIndex = end;
              });

              // Add any remaining text
              if (lastIndex < variable.value.length) {
                parts.push({
                  type: 'text',
                  content: variable.value.substring(lastIndex),
                });
              }
            } else {
              parts.push({ type: 'text', content: variable.value });
            }

            return (
              <div
                key={variable.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  padding: '16px 20px',
                  borderBottom:
                    index < filteredVars.length - 1 ? `1px solid ${BORDER_SUBTLE}` : 'none',
                  background:
                    index % 2 === 0 ? 'var(--color-background)' : 'var(--color-background-hover)',
                  fontFamily: 'monospace',
                  fontSize: 14,
                }}
              >
                <div style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                  {variable.name}
                </div>
                <div
                  style={{
                    color: 'var(--color-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {parts.map((part, idx) => {
                    if (part.type === 'color') {
                      return (
                        <div
                          key={`${part.content}-${idx}`}
                          style={{
                            width: 20,
                            height: 20,
                            background: part.content,
                            border: '1px solid var(--color-border)',
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                          title={part.content}
                        />
                      );
                    }
                    return <span key={`${part.content}-${idx}`}>{part.content}</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredVars.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--color-foreground-disable)',
            fontSize: 18,
          }}
        >
          No variables found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <CssVariablesPage />,
};
