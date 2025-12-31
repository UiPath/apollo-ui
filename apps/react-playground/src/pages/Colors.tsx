import { Colors as ColorsTokens } from '@uipath/apollo-react/core';
import { useState } from 'react';

import { PageContainer, PageDescription, PageTitle } from '../components/SharedStyles';
import {
  ColorCard,
  ColorGrid,
  ColorGroup,
  ColorName,
  ColorValue,
  GroupCount,
  GroupHeader,
  GroupTitle,
  NoResultsContainer,
  NoResultsIcon,
  NoResultsText,
  NoResultsTitle,
  SearchInput,
  SectionContainer,
} from './Colors.styles';

export function Colors() {
  const [searchTerm, setSearchTerm] = useState('');

  // Use the ColorsTokens namespace which contains only color tokens
  const colors = Object.entries(ColorsTokens)
    .filter(([key, value]) => key.startsWith('Color') && typeof value === 'string')
    .map(([name, value]) => ({ name, value: value as string }));

  // Separate colors into Semantic and Base categories
  const semanticColors: typeof colors = [];
  const baseColors: typeof colors = [];

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
    {} as Record<string, typeof colors>
  );

  const variantOrder = ['Dark', 'DarkHc', 'Light', 'LightHc'];

  const renderColorCard = (name: string, colorValue: string) => {
    const isLight = isLightColor(colorValue);
    const textColor = isLight ? 'var(--color-black)' : 'var(--color-white)';
    const textShadow = isLight ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.5)';

    return (
      <ColorCard
        key={name}
        $bgColor={colorValue}
        onClick={() => {
          navigator.clipboard.writeText(colorValue);
          alert(`Copied ${colorValue} to clipboard!`);
        }}
        title={`${name}\nClick to copy: ${colorValue}`}
      >
        <ColorName $textColor={textColor} $textShadow={textShadow}>
          {name.replace('Color', '')}
        </ColorName>
        <ColorValue $textColor={textColor} $textShadow={textShadow} $isLight={isLight}>
          {colorValue}
        </ColorValue>
      </ColorCard>
    );
  };

  // Filter groups and individual colors based on search term (searches both name and hex values)
  const filteredSemanticGroups = !searchTerm
    ? Object.entries(semanticGroups)
    : Object.entries(semanticGroups)
        .map(([groupName, variants]) => {
          // Filter variants within this group
          const filteredVariants = Object.entries(variants).filter(([variant, value]) => {
            const fullName = `${groupName}${variant}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return fullName.includes(searchLower) || value.toLowerCase().includes(searchLower);
          });

          return [groupName, Object.fromEntries(filteredVariants)];
        })
        .filter(([, variants]) => Object.keys(variants as Record<string, string>).length > 0); // Only keep groups with matching variants

  const filteredBaseColorGroups = !searchTerm
    ? Object.entries(baseColorGroups)
    : Object.entries(baseColorGroups)
        .map(([category, categoryColors]) => {
          // Filter colors within this category
          const filteredColors = categoryColors.filter((color) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              color.name.toLowerCase().includes(searchLower) ||
              color.value.toLowerCase().includes(searchLower)
            );
          });

          return [category, filteredColors];
        })
        .filter(([, colors]) => (colors as typeof baseColors).length > 0); // Only keep categories with matching colors

  // Count filtered colors
  const filteredSemanticCount = filteredSemanticGroups.reduce(
    (acc, [, variants]) => acc + Object.keys(variants as Record<string, string>).length,
    0
  );
  const filteredBaseCount = filteredBaseColorGroups.reduce(
    (acc, [, colors]) => acc + (colors as typeof baseColors).length,
    0
  );

  return (
    <PageContainer>
      <PageTitle>Colors</PageTitle>
      <PageDescription>
        Complete color palette with semantic naming ({colors.length} tokens)
      </PageDescription>

      <div style={{ marginBottom: '40px' }}>
        <SearchInput
          type="text"
          placeholder="Search colors by token name or hex"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm && filteredSemanticCount === 0 && filteredBaseCount === 0 && (
        <NoResultsContainer>
          <NoResultsIcon>🔍</NoResultsIcon>
          <NoResultsTitle>No results found</NoResultsTitle>
          <NoResultsText>Try searching for a different color name or hex value</NoResultsText>
        </NoResultsContainer>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {filteredSemanticCount > 0 && (
          <section>
            <h2
              style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: 'var(--color-primary)',
                borderBottom: `2px solid ${'var(--color-border)'}`,
                paddingBottom: '12px',
              }}
            >
              Semantic Colors
            </h2>
            <p
              style={{
                color: 'var(--color-foreground-de-em)',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              Theme-aware colors with dark and light variants (
              {searchTerm
                ? `${filteredSemanticCount}/${semanticColors.length}`
                : filteredSemanticCount}{' '}
              token{filteredSemanticCount !== 1 ? 's' : ''})
            </p>
            <SectionContainer>
              {filteredSemanticGroups
                .sort(([a], [b]) => (a as string).localeCompare(b as string))
                .map(([groupName, variants]) => {
                  const sortedVariants = Object.entries(variants as Record<string, string>).sort(
                    ([a], [b]) => {
                      const aIndex = variantOrder.indexOf(a);
                      const bIndex = variantOrder.indexOf(b);
                      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                    }
                  );

                  return (
                    <ColorGroup key={groupName as string}>
                      <GroupHeader>
                        <GroupTitle>{groupName as string}</GroupTitle>
                        <GroupCount>
                          {sortedVariants.length} variant
                          {sortedVariants.length > 1 ? 's' : ''}
                        </GroupCount>
                      </GroupHeader>

                      <ColorGrid>
                        {sortedVariants.map(([variant, colorValue]) =>
                          renderColorCard(`${groupName}${variant}`, colorValue)
                        )}
                      </ColorGrid>
                    </ColorGroup>
                  );
                })}
            </SectionContainer>
          </section>
        )}

        {filteredBaseCount > 0 && (
          <section>
            <h2
              style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: 'var(--color-primary)',
                borderBottom: `2px solid ${'var(--color-border)'}`,
                paddingBottom: '12px',
              }}
            >
              Base Colors
            </h2>
            <p
              style={{
                color: 'var(--color-foreground-de-em)',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              Foundation color palette (
              {searchTerm ? `${filteredBaseCount}/${baseColors.length}` : filteredBaseCount} token
              {filteredBaseCount !== 1 ? 's' : ''})
            </p>
            <SectionContainer>
              {filteredBaseColorGroups
                .sort(([a], [b]) => (a as string).localeCompare(b as string))
                .map(([category, categoryColors]) => (
                  <ColorGroup key={category as string}>
                    <GroupHeader>
                      <GroupTitle>{category as string}</GroupTitle>
                      <GroupCount>
                        {categoryColors?.length} color
                        {categoryColors?.length && categoryColors.length > 1 ? 's' : ''}
                      </GroupCount>
                    </GroupHeader>

                    <ColorGrid $columns="repeat(auto-fit, minmax(200px, 1fr))">
                      {(categoryColors as { name: string; value: string }[])!
                        .sort(
                          (
                            a: { name: string; value: string },
                            b: { name: string; value: string }
                          ) => a.name.localeCompare(b.name)
                        )
                        .map((color) => renderColorCard(color.name, color.value))}
                    </ColorGrid>
                  </ColorGroup>
                ))}
            </SectionContainer>
          </section>
        )}
      </div>
    </PageContainer>
  );
}

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
    // Blend with white background assuming most pages have white/light backgrounds
    r = Math.round(r * a + 255 * (1 - a));
    g = Math.round(g * a + 255 * (1 - a));
    b = Math.round(b * a + 255 * (1 - a));
  }

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140;
}
