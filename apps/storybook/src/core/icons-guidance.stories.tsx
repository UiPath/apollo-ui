import type { Meta, StoryObj } from '@storybook/react-vite';
import type { icons } from 'lucide-react';
import { Glyph, IconLibraryGuide } from './icon-guidance';
import { GuideTable, Section, WritingPage, WritingTab, WritingTabs } from './writing/writing-ui';

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
      <code style={{ fontSize: 12, padding: 0, background: 'none' }}>{name}</code>
    </span>
  );
}

function IconsGuidancePage() {
  return (
    <WritingPage
      title="Icon guidance"
      intro="Apollo uses two icon libraries. Start here to pick the right library, then use one icon per meaning so the same action looks the same in every product."
    >
      <WritingTabs>
        <WritingTab label="Which library?">
          <Section title="Which library?">
            <IconLibraryGuide />
          </Section>
        </WritingTab>

        <WritingTab label="Icon meanings">
          <Section
            title="Icon meanings"
            intro="Use one icon per meaning across every product. Icons crossed out are in use today for the same meaning and should move to the recommended icon."
          >
            <GuideTable
              columns={['Meaning', 'Use', 'Instead of']}
              rows={MEANINGS.map((m) => [
                <div key="meaning" className="min-w-40">
                  <span className="font-medium">{m.meaning}</span>
                  {m.note && <p className="mt-1 mb-0 text-xs text-muted-foreground">{m.note}</p>}
                </div>,
                m.use.map((n) => <IconChip key={n} name={n} tone="use" />),
                m.avoid.length === 0 ? (
                  <span key="none" className="text-muted-foreground">
                    None
                  </span>
                ) : (
                  m.avoid.map((n) => <IconChip key={n} name={n} tone="avoid" />)
                ),
              ])}
            />
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}

// Story name matches the page name so Storybook shows it as one sidebar entry.
export const Guidance: Story = {
  render: () => <IconsGuidancePage />,
};
