import type { Meta, StoryObj } from '@storybook/react-vite';
import type { icons } from 'lucide-react';
import { Glyph, IconLibraryGuide } from './icon-guidance';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from './shared';

const meta = {
  title: 'Icons/Guidance',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type IconKey = keyof typeof icons;

// ── Icon meanings ───────────────────────────────────────────────────────────
// One icon per meaning. `avoid` lists icons products use today for the same
// meaning that should move to `use`.

interface Meaning {
  meaning: string;
  use: IconKey[];
  avoid: IconKey[];
  note?: string;
}

const MEANINGS: Meaning[] = [
  {
    meaning: 'Variable, insert variable',
    use: ['Braces'],
    avoid: ['Variable', 'Database', 'SquareFunction'],
    note: 'Braces is reserved for variables. Pick another icon for the object data type and JSON view toggles.',
  },
  { meaning: 'Add, create', use: ['Plus'], avoid: [] },
  {
    meaning: 'Close, dismiss, clear',
    use: ['X'],
    avoid: ['CircleX'],
    note: 'Not for delete.',
  },
  { meaning: 'Delete, remove', use: ['Trash2'], avoid: ['Trash'] },
  { meaning: 'Edit', use: ['Pencil'], avoid: ['SquarePen', 'PenLine'] },
  { meaning: 'Copy', use: ['Copy'], avoid: [] },
  { meaning: 'Search', use: ['Search'], avoid: [] },
  { meaning: 'Filter', use: ['ListFilter'], avoid: ['Funnel'] },
  {
    meaning: 'Expand, collapse',
    use: ['ChevronRight', 'ChevronDown'],
    avoid: [],
    note: 'Right when collapsed, down when expanded or for a select trigger.',
  },
  {
    meaning: 'More actions',
    use: ['Ellipsis'],
    avoid: ['EllipsisVertical'],
    note: 'Vertical only inside dense table rows.',
  },
  { meaning: 'Drag handle', use: ['GripVertical'], avoid: ['GripHorizontal'] },
  { meaning: 'Settings', use: ['Settings'], avoid: ['Settings2', 'Cog'] },
  { meaning: 'Run, execute', use: ['Play'], avoid: ['CirclePlay'] },
  { meaning: 'Refresh, reload data', use: ['RefreshCw'], avoid: ['RefreshCcw'] },
  { meaning: 'Reset to default', use: ['RotateCcw'], avoid: ['RotateCw'] },
  { meaning: 'Download', use: ['Download'], avoid: [] },
  { meaning: 'Upload', use: ['Upload'], avoid: [] },
  { meaning: 'Open in new tab', use: ['ExternalLink'], avoid: [] },
  {
    meaning: 'Loading',
    use: ['LoaderCircle'],
    avoid: ['Loader'],
    note: 'Spin with animate-spin.',
  },
  { meaning: 'Error', use: ['CircleAlert'], avoid: ['CircleX', 'OctagonAlert'] },
  { meaning: 'Warning', use: ['TriangleAlert'], avoid: [] },
  { meaning: 'Info', use: ['Info'], avoid: [] },
  { meaning: 'Success', use: ['CircleCheck'], avoid: ['CircleCheckBig'] },
  { meaning: 'Help', use: ['CircleQuestionMark'], avoid: [] },
  { meaning: 'AI, generate', use: ['Sparkles'], avoid: ['WandSparkles'] },
  { meaning: 'Agent', use: ['Bot'], avoid: [] },
];

const tableCell = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'top',
  fontSize: 14,
  color: 'var(--color-foreground)',
} as const;

const headCell = {
  ...tableCell,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--color-foreground-de-emp)',
  textAlign: 'left',
} as const;

function IconChip({ name, tone }: { name: string; tone: 'use' | 'avoid' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid var(--color-border)',
        marginRight: 6,
        marginBottom: 4,
        color: tone === 'use' ? 'var(--color-foreground-emp)' : 'var(--color-foreground-de-emp)',
        textDecoration: tone === 'avoid' ? 'line-through' : 'none',
      }}
    >
      <Glyph name={name} size={16} />
      <code style={{ fontSize: 12 }}>{name}</code>
    </span>
  );
}

function IconsGuidancePage() {
  return (
    <PageContainer>
      <PageTitle>Icons Guidance</PageTitle>
      <PageDescription>
        Apollo uses two icon libraries. Start here to pick the right library, then use one icon per
        meaning so the same action looks the same in every product.
      </PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <section>
          <SectionHeader>Which library?</SectionHeader>
          <IconLibraryGuide />
        </section>

        <section>
          <SectionHeader>Icon meanings</SectionHeader>
          <SectionDescription>
            Use one icon per meaning across every product. Icons crossed out are in use today for
            the same meaning and should move to the recommended icon.
          </SectionDescription>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headCell}>Meaning</th>
                  <th style={headCell}>Use</th>
                  <th style={headCell}>Instead of</th>
                </tr>
              </thead>
              <tbody>
                {MEANINGS.map((m) => (
                  <tr key={m.meaning}>
                    <td style={{ ...tableCell, fontWeight: 500, minWidth: 180 }}>
                      {m.meaning}
                      {m.note && (
                        <div
                          style={{
                            fontWeight: 400,
                            fontSize: 12,
                            marginTop: 4,
                            color: 'var(--color-foreground-de-emp)',
                          }}
                        >
                          {m.note}
                        </div>
                      )}
                    </td>
                    <td style={tableCell}>
                      {m.use.map((n) => (
                        <IconChip key={n} name={n} tone="use" />
                      ))}
                    </td>
                    <td style={tableCell}>
                      {m.avoid.length === 0 ? (
                        <span style={{ color: 'var(--color-foreground-de-emp)' }}>None</span>
                      ) : (
                        m.avoid.map((n) => <IconChip key={n} name={n} tone="avoid" />)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

// Story name matches the page name so Storybook shows it as one sidebar entry.
export const Guidance: Story = {
  render: () => <IconsGuidancePage />,
};
