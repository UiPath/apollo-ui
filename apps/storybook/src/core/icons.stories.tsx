import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from '@uipath/apollo-react/core';
import * as ApolloIcons from '@uipath/apollo-react/icons';
import { Button, FormField, FormFieldLabel, Search } from '@uipath/apollo-wind';
import type React from 'react';
import { useMemo, useState } from 'react';
// Raw source of the generated icon index: each export line names the SVG's
// category folder, which is the only place that grouping is recorded.
import apolloIconsIndex from '../../../../packages/apollo-ui-icons/src/index.ts?raw';
import { GuidanceLink, ICON_CARD } from './icon-guidance';
import { useCopyToClipboard } from './shared';
import { Section, WritingPage, WritingTab, WritingTabs } from './writing/writing-ui';

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
    description: 'Logos for UiPath products and services.',
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
    <WritingPage
      title="Icons Apollo"
      intro={`The custom UiPath icon set, with ${iconNames.length} icons grouped by what they represent, plus sizing tokens.`}
    >
      <div className="mb-6">
        <GuidanceLink />
      </div>
      <WritingTabs>
        <WritingTab label="Icons">
          <Section
            title={`Icon library (${visibleCount})`}
            intro="Each category is a folder in apollo-ui-icons. Pick a category or search by name, then select an icon to copy its SVG."
          >
            <FormField className="mb-4">
              <FormFieldLabel htmlFor="apollo-icons-search">Search icons</FormFieldLabel>
              <Search
                id="apollo-icons-search"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by icon name, such as arrow or user"
              />
            </FormField>

            <div className="mb-8 flex flex-wrap gap-2">
              {[null, ...CATEGORY_ORDER].map((key) => {
                const active = category === key;
                return (
                  <Button
                    key={key ?? 'all'}
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    aria-pressed={active}
                    onClick={() => setCategory(key)}
                  >
                    {key ? categoryLabel(key) : 'All'}
                  </Button>
                );
              })}
            </div>

            {groups.map((group) => (
              <div key={group.key} className="mb-10">
                <h3>
                  {categoryLabel(group.key)}{' '}
                  <span className="font-normal text-muted-foreground">({group.icons.length})</span>
                </h3>
                {CATEGORY_INFO[group.key] && (
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_INFO[group.key].description}
                  </p>
                )}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
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
                        className={ICON_CARD}
                        onClick={(e) => handleCopySvg(e, iconName)}
                        title={`Select to copy the SVG: ${iconName}`}
                      >
                        <IconComponent size={40} color="currentColor" />
                        <span
                          className={
                            copied === iconName
                              ? 'line-clamp-2 break-words text-center text-[10px] leading-tight font-semibold text-primary'
                              : 'line-clamp-2 break-words text-center text-[10px] leading-tight text-muted-foreground'
                          }
                        >
                          {copied === iconName ? 'Copied' : iconName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {visibleCount === 0 && (
              <p className="py-12 text-center text-muted-foreground">
                No icons match &quot;{searchTerm}&quot;. Try a different name.
              </p>
            )}
          </Section>
        </WritingTab>

        <WritingTab label="Sizing tokens">
          <Section
            title={`Icon sizing tokens (${sizeTokens.length})`}
            intro="Standard icon sizes for consistent spacing."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sizeTokens.map((token) => (
                <div
                  key={token.name}
                  className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{token.name}</p>
                    <code>{token.value}</code>
                  </div>
                  <div className="flex min-h-24 w-full items-center justify-center">
                    <div
                      className="rounded-full bg-primary/40"
                      style={{ width: token.value, height: token.value }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    W: {token.value} · H: {token.value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}

// Story name matches the page name so Storybook shows it as one sidebar entry.
export const IconsApollo: Story = {
  render: () => <IconsPage />,
};
