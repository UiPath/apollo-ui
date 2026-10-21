import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField, FormFieldLabel, Search } from '@uipath/apollo-wind';
import { useMemo, useState } from 'react';
import { Glyph, GuidanceLink, ICON_CARD } from './icon-guidance';
import { LUCIDE_ICONS_IN_USE, LUCIDE_RENAMED } from './icons-lucide.data';
import { useCopyToClipboard } from './shared';
import { Section, WritingPage, WritingTab, WritingTabs } from './writing/writing-ui';

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
    <WritingPage
      title="Icons Lucide"
      intro={`Lucide is the UI icon library for Apollo Wind and product code. This page lists the ${LUCIDE_ICONS_IN_USE.length} lucide icons our products use today.`}
    >
      <div className="mb-6">
        <GuidanceLink />
      </div>
      <WritingTabs>
        <WritingTab label="Icons in use">
          <Section
            title={`Icons in use (${matchCount})`}
            intro="Every lucide icon imported by a UiPath product, grouped by category. Select an icon to copy its import. For anything not listed, check the full set at lucide.dev before adding a new icon."
          >
            <FormField className="mb-8">
              <FormFieldLabel htmlFor="lucide-icons-search">Search icons</FormFieldLabel>
              <Search
                id="lucide-icons-search"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by icon name, such as arrow or file"
              />
            </FormField>

            {grouped.map((group) => (
              <div key={group.name} className="mb-10">
                <h3>
                  {group.name}{' '}
                  <span className="font-normal text-muted-foreground">({group.icons.length})</span>
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
                  {group.icons.map((name) => (
                    <button
                      type="button"
                      key={name}
                      className={ICON_CARD}
                      title={`Select to copy the import: ${name}`}
                      onClick={() => copy(name, `import { ${name} } from 'lucide-react';`)}
                    >
                      <Glyph name={name} size={24} />
                      <span
                        className={
                          copied === name
                            ? 'break-words text-center text-[11px] leading-tight font-semibold text-primary'
                            : 'break-words text-center text-[11px] leading-tight text-muted-foreground'
                        }
                      >
                        {copied === name ? 'Copied' : name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {matchCount === 0 && (
              <p className="py-12 text-center text-muted-foreground">
                No icons match &quot;{searchTerm}&quot;. Try a different name.
              </p>
            )}
          </Section>
        </WritingTab>

        <WritingTab label="Renamed icons">
          <Section
            title={`Renamed icons (${renamed.length})`}
            intro="Lucide renamed these icons. The old names still work as aliases but are deprecated, and they make search results inconsistent. Import the current name in new code."
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-2">
              {renamed.map(([oldName, newName]) => (
                <div
                  key={oldName}
                  className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-[13px] [overflow-wrap:anywhere]"
                >
                  <Glyph name={newName} size={18} />
                  <code className="text-muted-foreground line-through">{oldName}</code>
                  <span className="text-muted-foreground">→</span>
                  <code>{newName}</code>
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
export const IconsLucide: Story = {
  render: () => <IconsLucidePage />,
};
