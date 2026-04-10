"use client";

import { icons } from "lucide-react";
import { useState } from "react";

type IconName = keyof typeof icons;

interface Category {
  name: string;
  pattern: RegExp;
}

const CATEGORIES: Category[] = [
  {
    name: "Arrows & Navigation",
    pattern:
      /Arrow|Chevron|Navigation|Compass|Route|TurnLeft|TurnRight|CornerUp|CornerDown|MoveUp|MoveDown|MoveLeft|MoveRight|Undo|Redo|Maximize|Minimize|Expand|Shrink/,
  },
  {
    name: "Shapes & Geometry",
    pattern:
      /^Circle|^Square|^Triangle|^Star|^Hexagon|^Diamond|^Pentagon|^Octagon|^Rectangle|^Cone|^Cylinder|^Torus/,
  },
  {
    name: "Layout & UI",
    pattern:
      /Layout|Grid|List|Panel|Sidebar|Table|Column|Row|^Menu|Navbar|Tab|Dock|StretchHorizontal|StretchVertical|GalleryHorizontal|GalleryVertical/,
  },
  { name: "Files & Folders", pattern: /^File|^Folder/ },
  {
    name: "Editing & Text",
    pattern:
      /^Edit|^Pen|^Pencil|^Type|^Text|Bold|Italic|Underline|Strike|^Align|Heading|^Link|Quote|^Eraser|Highlighter|Baseline|CaseSensitive|CaseUpper|CaseLower|Subscript|Superscript/,
  },
  {
    name: "Charts & Data",
    pattern:
      /Chart|^Bar|Pie|^Line|Trend|Activity|Analytics|Graph|Gauge|Sigma|Percent|Hash|Binary/,
  },
  {
    name: "Media & Audio",
    pattern:
      /Play|Pause|^Stop|Volume|Mute|Music|Audio|Video|Film|Camera|Mic|Speaker|Radio|Headphone|Clapperboard|Disc|Rewind|FastForward|Shuffle|Repeat/,
  },
  {
    name: "Communication",
    pattern:
      /^Mail|^Message|^Phone|^Bell|^Send|Inbox|Reply|Forward|Voicemail|MessageSquare|MessageCircle/,
  },
  {
    name: "People & Identity",
    pattern:
      /^User|^Person|^Baby|^Bot|^Ghost|^Skull|Crown|Smile|Frown|Meh|Angry|Annoyed|Laugh/,
  },
  {
    name: "Devices & Tech",
    pattern:
      /Laptop|Desktop|Monitor|Tablet|^Watch|Keyboard|Mouse|Printer|Server|Database|Cpu|HardDrive|Wifi|Bluetooth|Battery|Usb|Scan|QrCode|Barcode|Tv|Gamepad/,
  },
  {
    name: "Commerce & Finance",
    pattern:
      /Dollar|Euro|Pound|Currency|^Cart|^Shop|Wallet|Credit|Bank|Coin|Receipt|^Tag|Ticket|BadgeDollar|HandCoins|Banknote|ShoppingBag|ShoppingCart/,
  },
  {
    name: "Maps & Location",
    pattern: /^Map|Location|^Pin|^Globe|Gps|Milestone|Signpost|Waypoints/,
  },
  {
    name: "Security & Privacy",
    pattern: /^Lock|^Key|^Shield|^Eye|Fingerprint|Password|VenetianMask/,
  },
  {
    name: "Nature & Weather",
    pattern:
      /Sun|Moon|Cloud|Rain|Snow|Wind|Tree|Leaf|Plant|Flower|Mountain|Waves|Droplet|Flame|Zap|Tornado|Snowflake|Rainbow/,
  },
  {
    name: "Settings & Tools",
    pattern:
      /^Settings|^Wrench|^Hammer|^Slider|Toggle|^Cog|SlidersHorizontal|SlidersVertical|Filter/,
  },
];

function categorize(names: IconName[]): { name: string; icons: IconName[] }[] {
  const assigned = new Set<IconName>();
  const groups: { name: string; icons: IconName[] }[] = CATEGORIES.map(
    (cat) => {
      const matched = names.filter(
        (n) => !assigned.has(n) && cat.pattern.test(n),
      );
      matched.forEach((n) => assigned.add(n));
      return { name: cat.name, icons: matched };
    },
  );
  const other = names.filter((n) => !assigned.has(n));
  if (other.length > 0) groups.push({ name: "Other", icons: other });
  return groups.filter((g) => g.icons.length > 0);
}

function IconCell({
  name,
  isCopied,
  onCopy,
}: {
  name: IconName;
  isCopied: boolean;
  onCopy: (name: string) => void;
}) {
  const Icon = icons[name];
  return (
    <button
      type="button"
      title={`${name} — click to copy import`}
      onClick={() => onCopy(name)}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 text-foreground transition-colors hover:border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {isCopied ? (
        <span className="text-xs font-medium text-success h-5 flex items-center">
          ✓
        </span>
      ) : (
        <Icon size={20} strokeWidth={1.5} />
      )}
      <span className="w-full truncate text-center text-[10px] text-muted-foreground leading-tight">
        {name}
      </span>
    </button>
  );
}

export function IconGrid() {
  const [query, setQuery] = useState("");
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.keys(icons) is guaranteed to be IconName[]
  const allNames = Object.keys(icons) as IconName[];

  const isFiltering = query.trim().length > 0;

  const filtered = isFiltering
    ? allNames.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase().trim()),
      )
    : allNames;

  const groups = categorize(allNames);

  function handleCopy(name: string) {
    void navigator.clipboard
      .writeText(`import { ${name} } from 'lucide-react';`)
      .then(() => {
        setCopiedName(name);
        setTimeout(() => setCopiedName(null), 1500);
      });
  }

  return (
    <div className="not-prose my-6 flex flex-col gap-6">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="shrink-0 text-sm text-muted-foreground">
          {filtered.length.toLocaleString()} icon
          {filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filtered flat view */}
      {isFiltering &&
        (filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No icons match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
            {filtered.map((name) => (
              <IconCell
                key={name}
                name={name}
                isCopied={copiedName === name}
                onCopy={handleCopy}
              />
            ))}
          </div>
        ))}

      {/* Grouped view */}
      {!isFiltering && (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <div key={group.name}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {group.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {group.icons.length}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
                {group.icons.map((name) => (
                  <IconCell
                    key={name}
                    name={name}
                    isCopied={copiedName === name}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
