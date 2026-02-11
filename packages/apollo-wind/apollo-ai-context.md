# Apollo Wind — AI Context

> Feed this file to your AI tool (Cursor rules, Claude context, ChatGPT, etc.)
> to get consistent, design-system-aligned output when prototyping.

---

## Stack

- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- Lucide React icons
- Storybook 10

## Import Paths

```tsx
// Components — always use the @/ alias
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons — always from lucide-react
import { Search, Plus, X, ChevronDown } from 'lucide-react';

// Utilities
import { cn } from '@/lib';                           // class merging (clsx + tailwind-merge)
import { fontFamily } from '@/foundation/Future/typography'; // font stacks
```

## Available Components

### Core UI (from `@/components/ui/`)

| Component | Import | Description |
|-----------|--------|-------------|
| Accordion | `accordion` | Collapsible content sections (Radix) |
| Alert | `alert` | Status messages |
| AlertDialog | `alert-dialog` | Confirmation dialogs (Radix) |
| AspectRatio | `aspect-ratio` | Fixed aspect ratio containers |
| Avatar | `avatar` | User avatars with fallback |
| Badge | `badge` | Status/label badges |
| Breadcrumb | `breadcrumb` | Navigation breadcrumbs |
| Button | `button` | Primary action element. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` |
| ButtonGroup | `button-group` | Grouped button container |
| Calendar | `calendar` | Date calendar (react-day-picker) |
| Card | `card` | Content card with header/content/footer |
| Checkbox | `checkbox` | Toggle checkbox (Radix) |
| Collapsible | `collapsible` | Expand/collapse container (Radix) |
| Combobox | `combobox` | Searchable select (cmdk) |
| Command | `command` | Command palette (cmdk) |
| ContextMenu | `context-menu` | Right-click menu (Radix) |
| DataTable | `data-table` | Full-featured data grid (TanStack Table). Includes sorting, filtering, pagination, row selection, column toggle |
| DatePicker | `date-picker` | Date input with calendar popover |
| DateTimePicker | `datetime-picker` | Date + time input |
| Dialog | `dialog` | Modal dialog (Radix) |
| Drawer | `drawer` | Bottom sheet drawer (Vaul) |
| DropdownMenu | `dropdown-menu` | Dropdown menu (Radix) |
| EmptyState | `empty-state` | Placeholder for empty content |
| FileUpload | `file-upload` | File upload zone |
| HoverCard | `hover-card` | Hover-triggered card (Radix) |
| Input | `input` | Text input field |
| Label | `label` | Form label (Radix) |
| Layout (Grid, Row, Column) | `layout/grid`, `layout/row`, `layout/column` | Responsive layout primitives |
| Menubar | `menubar` | Horizontal menu bar (Radix) |
| MultiSelect | `multi-select` | Multiple selection dropdown |
| NavigationMenu | `navigation-menu` | Navigation links menu (Radix) |
| Pagination | `pagination` | Page navigation controls |
| Popover | `popover` | Popover overlay (Radix) |
| Progress | `progress` | Progress bar (Radix) |
| RadioGroup | `radio-group` | Radio button group (Radix) |
| Resizable | `resizable` | Resizable panel layout (react-resizable-panels) |
| ScrollArea | `scroll-area` | Custom scrollbar container (Radix) |
| Search | `search` | Search input with icon |
| Select | `select` | Dropdown select (Radix) |
| Separator | `separator` | Visual divider (Radix) |
| Sheet | `sheet` | Side panel / drawer (Radix Dialog) |
| Skeleton | `skeleton` | Loading placeholder |
| Slider | `slider` | Range slider (Radix) |
| Sonner | `sonner` | Toast notifications |
| Spinner | `spinner` | Loading spinner |
| StatsCard | `stats-card` | Metric/statistic display card |
| Stepper | `stepper` | Multi-step progress indicator |
| Switch | `switch` | Toggle switch (Radix) |
| Table | `table` | Static HTML table with styled parts |
| Tabs | `tabs` | Tabbed interface (Radix) |
| Textarea | `textarea` | Multi-line text input |
| Toggle | `toggle` | Toggle button (Radix) |
| ToggleGroup | `toggle-group` | Group of toggle buttons (Radix) |
| Tooltip | `tooltip` | Hover tooltip (Radix) |
| ViewportGuard | `viewport-guard` | Min-width gate for responsive layouts |

### Custom Components (from `@/components/custom/`)

| Component | Import | Description |
|-----------|--------|-------------|
| Canvas | `canvas` | Main content area for flow/delegate templates |
| MaestroHeader | `global-header` | Global app header with menu drawer, title, search, avatar |
| FlowNode | `flow-node` | Flow editor node element |
| FlowCanvasToolbar | `toolbar-canvas` | Bottom-center canvas mode toolbar |
| FlowViewToolbar | `toolbar-view` | Bottom-right zoom/view toolbar |
| PropertiesBar | `flow-properties-bar` | Collapsed properties bar |
| PropertiesExpanded | `flow-properties-expanded` | Full expanded properties panel |
| PropertiesSimple | `flow-properties-simple` | Compact properties panel with JSON editor drawer |
| FlowPanel | `panel-flow` | Left icon rail + expandable chat panel |
| DelegatePanel | `panel-delegate` | Delegate navigation panel |
| MaestroPanel | `panel-maestro` | Maestro side panels (left/right) |
| MaestroGrid | `grid-maestro` | Maestro content grid layout |
| ChatComposer | `chat-composer` | Chat message input |
| ChatFirstExperience | `chat-first-experience` | Empty chat state |
| ChatPromptSuggestions | `chat-prompt-suggestions` | Suggested prompts |
| ChatStepsView | `chat-steps-view` | Chat step progress |

## Theming

### How it works

Themes use CSS custom properties scoped to CSS classes. Apply a class to a parent element to activate a theme:

```tsx
// Wrap your component in a theme class
<div className="future-dark">  {/* or: future-light, legacy-dark, legacy-light */}
  <YourComponent />
</div>
```

No runtime theme provider is needed. Tailwind utilities resolve automatically based on the active theme class.

### Theme classes

| Class | Description |
|-------|-------------|
| `future-dark` | Future design language — dark mode (default) |
| `future-light` | Future design language — light mode |
| `legacy-dark` | Legacy design language — dark mode |
| `legacy-light` | Legacy design language — light mode |

### Color tokens (use these, not raw colors)

**Surfaces (backgrounds):**
- `bg-future-surface` — page/canvas background
- `bg-future-surface-raised` — cards, panels
- `bg-future-surface-overlay` — inputs, tabs, icon rail
- `bg-future-surface-hover` — hover/selected states
- `bg-future-surface-muted` — badges, indicators
- `bg-future-surface-inverse` — inverse backgrounds (primary buttons)

**Accent:**
- `bg-future-accent` — primary accent (cyan)
- `bg-future-accent-subtle` — subtle accent backgrounds

**Text/icons (foreground):**
- `text-future-foreground` — primary text
- `text-future-foreground-secondary` — body text
- `text-future-foreground-muted` — secondary UI text
- `text-future-foreground-subtle` — muted labels
- `text-future-foreground-inverse` — text on inverse backgrounds
- `text-future-accent-foreground` — accent-colored text/icons

**Borders:**
- `border-future-border` — primary borders
- `border-future-border-subtle` — subtle dividers
- `border-future-border-muted` — content borders

### Typography

- **Primary font:** Inter (sans-serif)
- **Monospace font:** JetBrains Mono
- Apply via: `style={{ fontFamily: fontFamily.base }}`

## Rules — Do This, Not That

### DO
- Use `future-*` token classes for all colors (`bg-future-surface`, `text-future-foreground`, etc.)
- Import components from `@/components/ui/` and `@/components/custom/`
- Import icons from `lucide-react`
- Use `cn()` from `@/lib` to merge classes conditionally
- Use Tailwind utility classes for layout (`flex`, `grid`, `gap-*`, `p-*`, etc.)
- Use the `fontFamily.base` font stack from `@/foundation/Future/typography`
- Use shadcn `Button` variants (`default`, `outline`, `ghost`, `secondary`)
- Apply theme class to root element (`future-dark`, `future-light`)

### DO NOT
- Do NOT use raw hex colors or Tailwind color palette (e.g. `bg-zinc-900`)
- Do NOT use Material UI, Emotion, or styled-components
- Do NOT install additional UI libraries (use what's available above)
- Do NOT use `bg-black`, `bg-white`, `text-gray-*` — always use semantic tokens
- Do NOT hardcode light/dark values — the theme system handles this automatically

## File Structure

```
packages/apollo-wind/src/
├── components/
│   ├── ui/           # shadcn components (Button, Input, Select, etc.)
│   └── custom/       # Apollo-specific components (MaestroHeader, FlowPanel, etc.)
├── foundation/
│   └── Future/
│       ├── colors.ts           # Color token definitions
│       ├── typography.ts       # Typography token definitions
│       ├── future-theme.css    # Future theme CSS variables
│       └── legacy-theme.css    # Legacy theme CSS variables
├── templates/
│   ├── Maestro/      # Maestro template (Landing, Dashboard)
│   ├── Delegate/     # Delegate template (Home, Settings)
│   ├── Admin/        # Admin template (Landing, Data Management)
│   └── Flow/         # Flow editor template (Properties, Properties Simple)
├── lib/
│   └── index.ts      # cn() utility
└── styles/
    └── tailwind.css   # Main CSS entry (imports theme files)
```

## Example: Creating a Simple Card Component

```tsx
import { cn } from '@/lib';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

function FeatureCard({ title, description, tag }: {
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div className="rounded-2xl border border-future-border-subtle bg-future-surface-raised p-6">
      <Badge className="mb-3 bg-future-accent-subtle text-future-accent-foreground">
        {tag}
      </Badge>
      <h3 className="mb-2 text-lg font-semibold text-future-foreground">{title}</h3>
      <p className="mb-4 text-sm text-future-foreground-muted">{description}</p>
      <Button variant="ghost" className="text-future-foreground-muted">
        Learn more <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
```
