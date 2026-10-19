import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { Glyph, GuidanceLink } from './icon-guidance';
import { LUCIDE_ICONS_IN_USE, LUCIDE_RENAMED } from './icons-lucide.data';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SearchInput,
  SectionDescription,
  SectionHeader,
  useCopyToClipboard,
} from './shared';

const meta = {
  title: 'Icons/Icons Lucide',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
// ── Categories for the "in use" grid ────────────────────────────────────────
// First match wins, so order matters (status before shapes, etc.).

// `pattern` matches anywhere in the name, first category wins. `names` lists
// exact names and is checked before any pattern, for names a substring match
// would misfile (e.g. `X`, `Bot` vs `PanelBottom`, `Key` vs `Keyboard`).
const CATEGORIES: { name: string; pattern: RegExp; names?: string[] }[] = [
  {
    name: 'Status & feedback',
    pattern:
      /Alert|Question|Info|Loader|CircleCheck|SquareCheck|CircleX|OctagonX|Ban|Bell|Badge|CircleDot|CircleDashed|CircleSlash|Siren/,
    names: ['Check'],
  },
  {
    name: 'Arrows & navigation',
    pattern:
      /Arrow|Chevron|Undo|Redo|Maximize|Minimize|Expand|Shrink|House|Menu|Navigation|Compass|LogIn|LogOut|Fullscreen|Locate|ZoomIn|ZoomOut/,
    names: ['CornerDownRight', 'CornerLeftUp', 'CornerRightUp', 'MoveDown', 'MoveUp', 'MapPin'],
  },
  {
    name: 'Variables, code & data',
    pattern:
      /Braces|Brackets|Variable|Function|Code|Terminal|Binary|Hash|Database|Table|Sheet|Regex|Bug|Json|Sigma|Parentheses|Server|Cpu/,
    names: ['Type'],
  },
  {
    name: 'Files & folders',
    pattern: /File|Folder|Archive|Package|Paperclip|Clipboard|Book|Notebook|Image/,
    names: ['Box'],
  },
  {
    name: 'AI & automation',
    pattern:
      /Sparkle|Wand|Brain|Workflow|Zap|Flask|Git|Network|Webhook|Plug|Cable|Route|Split|Merge|Repeat|Infinity/,
    names: ['Bot'],
  },
  {
    name: 'Actions & editing',
    pattern:
      /Plus|Minus|Trash|Pencil|Pen|Copy|Save|Search|Filter|Funnel|Download|Upload|Refresh|Rotate|Share|Link|Scissors|Eraser|Ellipsis|Grip|Settings|Slider|Wrench|Play|Pause|Stop|Send|Pin|Eye|Import|Replace|Wand|Cog|Power|Hammer/,
    names: ['X'],
  },
  {
    name: 'Text & layout',
    pattern:
      /Text|Align|Bold|Italic|Underline|List|Heading|Columns|Rows|Layout|Panel|Grid|Pilcrow|Quote|Rectangle|Square|Layers|Separator|Space|Strikethrough|ALargeSmall|[Ff]old|[Gg]roup|Equal|Asterisk|StickyNote/,
  },
  {
    name: 'People & communication',
    pattern: /User|Mail|Message|Phone|AtSign|Contact|Inbox|Mic|Video|Headphone/,
    names: [
      'MessageCircleDashed',
      'MessageCirclePlus',
      'MessageSquare',
      'MessageSquarePlus',
      'MessageSquareText',
      'UserCog',
      'UserPlus',
    ],
  },
  { name: 'Time & calendar', pattern: /Clock|Calendar|Timer|History|Hourglass|Alarm/ },
  { name: 'Charts & analytics', pattern: /Chart|Trending|Activity|Gauge|Target|Percent/ },
  { name: 'Security', pattern: /Lock|Shield|Fingerprint|ScanFace/, names: ['Key', 'KeyRound'] },
  { name: 'Feedback & favorites', pattern: /Star|Heart|Thumbs|Award|Flag/ },
  { name: 'Theme & appearance', pattern: /Sun|Moon|Palette|Toggle|Brush|Feather/ },
  {
    name: 'Devices & system',
    pattern:
      /Laptop|Monitor|HardDrive|Battery|Wifi|Cloud|Globe|RadioTower|Command|Unplug|Disc|AppWindow|PictureInPicture|MousePointer|Scan|Languages|View/,
    names: ['Keyboard'],
  },
  { name: 'Media', pattern: /Film|Music|Volume|Skip|StepForward/ },
  {
    name: 'Business & commerce',
    pattern:
      /Coins|Dollar|CreditCard|Receipt|Shopping|Store|Briefcase|Building|Landmark|Truck|Scale|Calculator|Tag|Newspaper|Library/,
    names: ['Car', 'Map'],
  },
];

function categoryOf(name: string) {
  const match =
    CATEGORIES.find((c) => c.names?.includes(name)) ?? CATEGORIES.find((c) => c.pattern.test(name));
  return match?.name ?? 'Other';
}

const CATEGORY_ORDER = [...CATEGORIES.map((c) => c.name), 'Other'];

const cardStyle = {
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
  minHeight: 96,
  color: 'var(--color-foreground)',
  font: 'inherit',
} as const;

function IconsLucidePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { copied, copy } = useCopyToClipboard();

  const grouped = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const groups = new Map<string, string[]>();
    for (const name of LUCIDE_ICONS_IN_USE) {
      if (query && !name.toLowerCase().includes(query)) continue;
      const category = categoryOf(name);
      groups.set(category, [...(groups.get(category) ?? []), name]);
    }
    return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
      name: c,
      icons: groups.get(c) ?? [],
    }));
  }, [searchTerm]);

  const matchCount = grouped.reduce((sum, g) => sum + g.icons.length, 0);
  const renamed = Object.entries(LUCIDE_RENAMED);

  return (
    <PageContainer>
      <PageTitle>Icons Lucide</PageTitle>
      <PageDescription>
        Lucide is the UI icon library for Apollo Wind and product code. This page lists the{' '}
        {LUCIDE_ICONS_IN_USE.length} lucide icons our products use today.
      </PageDescription>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <GuidanceLink />

        <section>
          <SectionHeader>Renamed icons ({renamed.length})</SectionHeader>
          <SectionDescription>
            Lucide renamed these icons. The old names still work as aliases but are deprecated, and
            they make search results inconsistent. Import the current name in new code.
          </SectionDescription>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 8,
            }}
          >
            {renamed.map(([oldName, newName]) => (
              <div
                key={oldName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px 10px',
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <Glyph name={newName} size={18} />
                <code
                  style={{
                    color: 'var(--color-foreground-de-emp)',
                    textDecoration: 'line-through',
                  }}
                >
                  {oldName}
                </code>
                <span style={{ color: 'var(--color-foreground-de-emp)' }}>→</span>
                <code style={{ color: 'var(--color-foreground-emp)' }}>{newName}</code>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader>Icons in use ({matchCount})</SectionHeader>
          <SectionDescription>
            Every lucide icon imported by a UiPath product, grouped by category. Click an icon to
            copy its import. For anything not listed, check the full set at lucide.dev before adding
            a new icon.
          </SectionDescription>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search icons... (e.g., 'arrow', 'file', 'circle')"
            style={{ marginBottom: 32 }}
          />

          {grouped.map((group) => (
            <div key={group.name} style={{ marginBottom: 40 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: 'var(--color-foreground-emp)',
                }}
              >
                {group.name}{' '}
                <span style={{ fontWeight: 400, color: 'var(--color-foreground-de-emp)' }}>
                  ({group.icons.length})
                </span>
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
                  gap: 8,
                }}
              >
                {group.icons.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className="sb-core-icon-card"
                    title={`Click to copy import: ${name}`}
                    onClick={() => copy(name, `import { ${name} } from 'lucide-react';`)}
                    style={cardStyle}
                  >
                    <Glyph name={name} size={24} />
                    <div
                      style={{
                        fontSize: 11,
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                        color:
                          copied === name
                            ? 'var(--color-primary)'
                            : 'var(--color-foreground-de-emp)',
                        fontWeight: copied === name ? 'bold' : 'normal',
                      }}
                    >
                      {copied === name ? 'Copied!' : name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {matchCount === 0 && (
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
      </div>
    </PageContainer>
  );
}

// Story name matches the page name so Storybook shows it as one sidebar entry.
export const IconsLucide: Story = {
  render: () => <IconsLucidePage />,
};
