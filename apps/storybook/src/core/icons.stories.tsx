import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from '@uipath/apollo-react/core';
import * as ApolloIcons from '@uipath/apollo-react/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
// Raw source of the generated icon index: each export line names the SVG's
// category folder, which is the only place that grouping is recorded.
import apolloIconsIndex from '../../../../packages/apollo-ui-icons/src/index.ts?raw';
import { GuidanceLink } from './icon-guidance';
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
  title: 'Icons/Icons Apollo',
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

const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  action: { label: 'Actions', description: 'Verbs a user triggers, such as copy, deploy, or run.' },
  navigation: { label: 'Navigation', description: 'Arrows, menus, paging, and zoom.' },
  'indicator-and-alert': {
    label: 'Status & alerts',
    description: 'Errors, warnings, success, notifications, and progress.',
  },
  toggle: {
    label: 'Toggles & selection',
    description: 'Checkbox, radio, favourite, and visibility states.',
  },
  editor: {
    label: 'Editor & charts',
    description: 'Text formatting, layout alignment, and chart types.',
  },
  object: {
    label: 'Objects',
    description:
      'Automation artifacts: files, folders, robots, queues, expressions, and data types.',
  },
  logic: {
    label: 'Workflow logic',
    description: 'Control flow such as if, switch, loops, and retry.',
  },
  social: { label: 'People & social', description: 'Users, groups, sharing, and sentiment.' },
  'product-logo': {
    label: 'UiPath products',
    description:
      'Logos for UiPath products and services. The Logos page shows them full size, with brand logos.',
  },
  'third-party': { label: 'Third-party logos', description: 'Connector and vendor brand marks.' },
  'studio-icons': { label: 'Studio', description: 'Studio commands and activity shortcuts.' },
  'studio-activities-icon-sets': {
    label: 'Studio activities',
    description: 'Activity icons grouped by activity package.',
  },
  'ui-agents-icons': { label: 'Agents', description: 'Agent nodes and agent trace views.' },
  'ui-bpmn-canvas': {
    label: 'BPMN canvas',
    description: 'BPMN events, gateways, data, and toolbar.',
  },
};

// icon name → category folder, parsed from the generated index exports.
const ICON_CATEGORY = new Map<string, string>(
  [...apolloIconsIndex.matchAll(/export \{ default as (\w+) \} from '\.\/svg\/([^/]+)\//g)].map(
    (m) => [m[1], m[2]] as [string, string]
  )
);

const CATEGORY_ORDER = [
  ...Object.keys(CATEGORY_INFO),
  ...new Set([...ICON_CATEGORY.values()].filter((c) => !(c in CATEGORY_INFO))),
];

function categoryLabel(key: string) {
  return CATEGORY_INFO[key]?.label ?? key;
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

  const [category, setCategory] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byCategory = new Map<string, string[]>();
    for (const name of filteredIconNames) {
      const key = ICON_CATEGORY.get(name) ?? 'other';
      if (category && key !== category) continue;
      byCategory.set(key, [...(byCategory.get(key) ?? []), name]);
    }
    return [...CATEGORY_ORDER, 'other']
      .filter((key) => byCategory.has(key))
      .map((key) => ({ key, icons: byCategory.get(key) ?? [] }));
  }, [filteredIconNames, category]);

  const visibleCount = groups.reduce((sum, g) => sum + g.icons.length, 0);

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
      <PageTitle>Icons Apollo</PageTitle>
      <PageDescription>
        The custom UiPath icon set, with {iconNames.length} icons grouped by what they represent,
        plus sizing tokens.
      </PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <GuidanceLink />

        {/* Icon Browser */}
        <section>
          <SectionHeader>Icon Library ({visibleCount} icons)</SectionHeader>
          <SectionDescription>
            Each category is a folder in apollo-ui-icons. Pick a category or search by name, then
            click an icon to copy its SVG.
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
              marginBottom: 16,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {[null, ...CATEGORY_ORDER].map((key) => {
              const active = category === key;
              return (
                <button
                  type="button"
                  key={key ?? 'all'}
                  aria-pressed={active}
                  onClick={() => setCategory(key)}
                  style={{
                    font: 'inherit',
                    fontSize: 13,
                    padding: '6px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-primary)' : 'var(--color-background)',
                    color: active ? 'var(--color-foreground-inverse)' : 'var(--color-foreground)',
                  }}
                >
                  {key ? categoryLabel(key) : 'All'}
                </button>
              );
            })}
          </div>

          {groups.map((group) => (
            <div key={group.key} style={{ marginBottom: 40 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: 'var(--color-foreground-emp)',
                }}
              >
                {categoryLabel(group.key)}{' '}
                <span style={{ fontWeight: 400, color: 'var(--color-foreground-de-emp)' }}>
                  ({group.icons.length})
                </span>
              </h3>
              {CATEGORY_INFO[group.key] && (
                <p
                  style={{
                    fontSize: 13,
                    marginBottom: 12,
                    color: 'var(--color-foreground-de-emp)',
                  }}
                >
                  {CATEGORY_INFO[group.key].description}
                </p>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                  gap: 8,
                }}
              >
                {group.icons.map((iconName) => {
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
            </div>
          ))}

          {visibleCount === 0 && (
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

// Story name matches the page name so Storybook shows it as one sidebar entry.
export const IconsApollo: Story = {
  render: () => <IconsPage />,
};
