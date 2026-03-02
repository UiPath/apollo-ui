# Apollo Wind — AI Context

> Feed this file to your AI tool (Cursor rules, Claude context, ChatGPT, v0, etc.)
> to get consistent, design-system-aligned output when prototyping.

---

## Stack

- React 19, TypeScript, Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- Lucide React icons
- Storybook 10

## Import Paths

```tsx
// UI components — always use the @/ alias
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Icons — always from lucide-react
import { Search, Plus, X, ChevronDown } from 'lucide-react';

// Utilities
import { cn } from '@/lib';                           // class merging (clsx + tailwind-merge)
import { get } from '@/lib';                          // safe nested object access
import { deepEqual } from '@/lib';                    // deep equality check
import { fontFamily } from '@/foundation/Future/typography'; // font stacks
```

---

## Theming

Themes use CSS custom properties scoped to CSS classes. Apply a class to a parent element — no runtime provider needed. Tailwind utilities resolve automatically.

```tsx
<div className="future-dark">
  <YourComponent />
</div>
```

| Class | Description |
|-------|-------------|
| `future-dark` | Future design language — dark mode (default) |
| `future-light` | Future design language — light mode |
| `core-dark` | Core design language — dark mode |
| `core-light` | Core design language — light mode |

### Color tokens (use these, not raw colors)

**Surfaces (backgrounds):**
- `bg-surface` — page/canvas background
- `bg-surface-raised` — cards, panels
- `bg-surface-overlay` — inputs, tabs, icon rail
- `bg-surface-hover` — hover/selected states
- `bg-surface-muted` — badges, indicators
- `bg-surface-inverse` — inverse backgrounds

**Brand:**
- `bg-brand` — primary brand cyan (#0891b2)
- `bg-brand-subtle` — subtle accent backgrounds

**Text/icons (foreground):**
- `text-foreground` — primary text
- `text-foreground-secondary` — body text
- `text-foreground-muted` — secondary UI text
- `text-foreground-subtle` — muted labels
- `text-foreground-inverse` — text on inverse backgrounds
- `text-foreground-accent` — accent-colored text/icons

**Borders:**
- `border-border` — primary borders
- `border-border-subtle` — subtle dividers
- `border-border-muted` — content borders

### Bridge tokens (cross-theme compatible)

For code that must work across all 4 themes (Future + Core), use these shadcn bridge tokens instead of `future-*`. They resolve correctly under any theme class.

- **Surfaces:** `bg-background`, `bg-card`, `bg-muted`, `bg-muted/50`
- **Text:** `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- **Borders:** `border-border`, `border-input`
- **Accent:** `bg-primary`, `text-primary`, `text-primary-foreground`, `bg-primary/10`

> **When to use which:** Use `future-*` tokens when building for a specific theme. Use bridge tokens when the same code must render across Future and Core themes.

### Typography

- **Primary font:** Inter (`fontFamily.base`)
- **Monospace font:** JetBrains Mono (`fontFamily.monospace`)
- Apply via: `style={{ fontFamily: fontFamily.base }}`

---

## Components

### Core UI (`@/components/ui/`)

#### Button

```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>
```

#### Card

```tsx
<Card className="bg-card text-card-foreground">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle text</CardDescription>
  </CardHeader>
  <CardContent>Main content here</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Table (static)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-muted-foreground">Name</TableHead>
      <TableHead className="text-muted-foreground">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-foreground">John Doe</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### DataTable (full-featured)

Sorting, filtering, pagination, row selection, and column toggle — built on TanStack Table.

```tsx
import { DataTable } from '@/components/ui/data-table';

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'role', header: 'Role' },
];

<DataTable columns={columns} data={data} />
```

#### Badge

```tsx
<Badge>Default</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
```

#### Input, Label, Select, Textarea

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name..." />
</div>

<Textarea placeholder="Write a description..." />

<Select>
  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

#### Tabs

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="analytics">Analytics content</TabsContent>
</Tabs>
```

#### Dialog & Sheet

```tsx
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter><Button>Save</Button></DialogFooter>
  </DialogContent>
</Dialog>

<Sheet>
  <SheetTrigger asChild><Button>Open Panel</Button></SheetTrigger>
  <SheetContent side="right">Panel content</SheetContent>
</Sheet>
```

#### Other available components

Accordion, Alert, AlertDialog, AspectRatio, Avatar, Breadcrumb, ButtonGroup,
Calendar, Checkbox, Collapsible, Combobox, Command, ContextMenu, DatePicker,
DateTimePicker, Drawer, DropdownMenu, EditableCell, EmptyState, FileUpload,
HoverCard, Layout (Grid/Row/Column), Menubar, MultiSelect, NavigationMenu,
Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Search,
Separator, Skeleton, Slider, Sonner, Spinner, StatsCard, Stepper, Switch,
Toggle, ToggleGroup, Tooltip, TreeView

All imported from `@/components/ui/<component-name>`.

### Custom Components (`@/components/custom/`)

| Component | Import | Purpose |
|-----------|--------|---------|
| ViewportGuard | `viewport-guard` | Min-width gate for templates |
| Canvas | `canvas` | Main content area for templates |
| MaestroHeader | `global-header` | Global app header with menu, search, avatar |
| FlowNode | `flow-node` | Flow editor node element |
| FlowCanvasToolbar | `toolbar-canvas` | Bottom canvas mode toolbar |
| FlowViewToolbar | `toolbar-view` | Bottom zoom/view toolbar |
| FlowProperties | `flow-properties` | Flow properties panel (`expanded` prop) |
| PropertiesSimple | `flow-properties-simple` | Compact properties with JSON drawer |
| FlowPanel | `panel-flow` | Left icon rail + expandable chat |
| DelegatePanel | `panel-delegate` | Delegate navigation panel |
| MaestroPanel | `panel-maestro` | Maestro side panels |
| MaestroGrid | `grid-maestro` | Maestro content grid |
| ChatComposer | `chat-composer` | Chat message input |
| ChatFirstExperience | `chat-first-experience` | Empty chat state |
| ChatPromptSuggestions | `chat-prompt-suggestions` | Suggested prompts |
| ChatStepsView | `chat-steps-view` | Chat step progress |

### Forms System (`@/components/forms/`)

MetadataForm, FormFieldRenderer, FormDesigner, FormStateViewer, RulesEngine,
RuleBuilder, ExpressionBuilder, DataFetcher, DataSourceBuilder

All imported from `@/components/forms/<component-name>`.

---

## Page Templates

Full-page layouts. Apply a theme and render children inside.

### MaestroTemplate

Dashboard layout with global header, collapsible left/right panels, and responsive grid.

```tsx
import { MaestroTemplate, Canvas, Grid, GridItem } from '@/templates/Maestro/template-maestro';
import { Panel } from '@/components/custom/panel-maestro';

<MaestroTemplate
  theme="dark"
  title="Dashboard"
  leftPanelContent={<div>Left panel</div>}
  rightPanelContent={<div>Right panel</div>}
>
  <Canvas>
    <Grid>
      <GridItem colSpan={2}>
        <Card className="bg-card"><CardContent className="pt-6">
          <span className="text-2xl font-bold text-foreground">$1.2M</span>
          <p className="text-sm text-muted-foreground">Revenue</p>
        </CardContent></Card>
      </GridItem>
      <GridItem>
        <Card className="bg-card"><CardContent className="pt-6">
          <span className="text-2xl font-bold text-foreground">8,421</span>
          <p className="text-sm text-muted-foreground">Users</p>
        </CardContent></Card>
      </GridItem>
    </Grid>
  </Canvas>
</MaestroTemplate>
```

**Props:** `theme`, `title`, `tenantName`, `defaultLeftPanelCollapsed`, `leftPanelContent` (ReactNode), `defaultRightPanelCollapsed`, `rightPanelContent` (ReactNode), `children` (main canvas).

**Sub-components:** `Canvas` (scrollable main area), `Grid` + `GridItem` (responsive grid — `colSpan`, `rowSpan`), `Panel` (collapsible side panel).

### AdminTemplate

Admin layout with global header, optional sidebar, and main content area.

```tsx
import {
  AdminTemplate, AdminSidebar, AdminSidebarHeader, AdminSidebarNav,
  AdminPageHeader, AdminToolbar
} from '@/templates/Admin/template-admin';

<AdminTemplate
  theme="dark"
  title="Administration"
  sidebar={
    <AdminSidebar width={260}>
      <AdminSidebarHeader title="Settings" icon={<Settings className="h-4 w-4" />} />
      <AdminSidebarNav
        items={[
          { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
          { id: 'roles', label: 'Roles', icon: <Shield className="h-4 w-4" /> },
        ]}
        selectedId="users"
        onSelect={(id) => console.log(id)}
      />
    </AdminSidebar>
  }
>
  <AdminPageHeader
    title="User Management"
    breadcrumb={['Settings', 'Users']}
    actions={<Button size="sm">Add User</Button>}
  />
  <AdminToolbar actions={<Button variant="outline" size="sm">Export</Button>}>
    <Input placeholder="Search users..." className="w-64" />
  </AdminToolbar>
  <div className="flex-1 p-6">
    {/* Table or content */}
  </div>
</AdminTemplate>
```

**Props:** `theme`, `title`, `menuContent` (ReactNode for header drawer), `sidebar` (ReactNode), `children` (main area).

**Sub-components:**
- `AdminSidebar` — props: `width` (default 260), `children`
- `AdminSidebarHeader` — props: `title`, `icon`, `actions`
- `AdminSidebarNav` — props: `items` (`{id, label, icon?, badge?}[]`), `selectedId`, `onSelect`
- `AdminPageHeader` — props: `title`, `breadcrumb` (string[]), `actions`, `tabs` (`{value, label}[]`), `activeTab`, `onTabChange`
- `AdminToolbar` — props: `children` (left side filters), `actions` (right side)

### FlowTemplate

Flow/workflow editor with left chat panel, canvas, properties bar, and toolbars.

```tsx
import { FlowTemplate } from '@/templates/Flow/template-flow';

<FlowTemplate theme="dark" defaultPanelOpen={true} flowName="My Workflow">
  {/* Canvas content */}
</FlowTemplate>
```

**Props:** `theme`, `defaultPanelOpen` (boolean), `flowName`, `flowType`, `children` (canvas content).

### DelegateTemplate

Agent layout with collapsible navigation panel and canvas.

```tsx
import { DelegateTemplate } from '@/templates/Delegate/template-delegate';

<DelegateTemplate theme="dark" defaultPanelOpen={true}>
  {/* Canvas content */}
</DelegateTemplate>
```

**Props:** `theme`, `defaultPanelOpen` (boolean), `navItems` (nav sections array), `selectedChildId`, `onChildSelect`, `children` (canvas content).

---

## Common Patterns

### Card grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="bg-card">
    <CardHeader>
      <CardTitle className="text-foreground">Revenue</CardTitle>
      <CardDescription className="text-muted-foreground">Monthly total</CardDescription>
    </CardHeader>
    <CardContent>
      <span className="text-2xl font-bold text-foreground">$1.2M</span>
    </CardContent>
  </Card>
  {/* more cards */}
</div>
```

### Section header with action

```tsx
<div className="flex items-center justify-between">
  <div>
    <h2 className="text-lg font-semibold text-foreground">Section Title</h2>
    <p className="text-sm text-muted-foreground">Helpful description</p>
  </div>
  <Button>Action</Button>
</div>
```

### Sidebar + main content

```tsx
<div className="flex h-screen">
  <aside className="w-64 border-r border-border bg-card p-4">
    <nav className="space-y-1">
      <a className="block rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Active</a>
      <a className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">Item</a>
    </nav>
  </aside>
  <main className="flex-1 overflow-auto p-6">
    {/* Content */}
  </main>
</div>
```

### Stats row

```tsx
<div className="grid grid-cols-4 gap-4">
  <Card className="bg-card">
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Total Users</p>
      <span className="text-2xl font-bold text-foreground">8,421</span>
      <p className="text-xs text-primary">+12% from last month</p>
    </CardContent>
  </Card>
  {/* more stat cards */}
</div>
```

---

## Rules

### DO
- Use semantic token classes for all colors (`future-*` or bridge tokens)
- Import components from `@/components/ui/` and `@/components/custom/`
- Import icons from `lucide-react`
- Use `cn()` from `@/lib` to merge classes conditionally
- Use Tailwind utility classes for layout (`flex`, `grid`, `gap-*`, `p-*`, etc.)
- Use shadcn components (Card, Table, Button, Badge, etc.) instead of raw HTML
- Apply theme class to root element (`future-dark`, `future-light`, etc.)

### DO NOT
- Do NOT use raw hex colors or Tailwind palette (`bg-zinc-900`, `text-gray-400`)
- Do NOT use `bg-black`, `bg-white` — always use semantic tokens
- Do NOT use Material UI, Emotion, or styled-components
- Do NOT install additional UI libraries
- Do NOT hardcode light/dark values — the theme system handles this automatically

---

## File Structure

```
packages/apollo-wind/src/
├── components/
│   ├── ui/           # shadcn components (Button, Input, Select, etc.)
│   ├── custom/       # Apollo-specific components (MaestroHeader, FlowPanel, etc.)
│   └── forms/        # Dynamic form system
├── foundation/
│   └── Future/
│       ├── colors.ts           # Color token definitions
│       ├── typography.ts       # Font stacks
│       ├── themes.css           # All theme CSS variables
│       └── ... (stories, tokens)
├── templates/
│   ├── Admin/        # AdminTemplate + sub-components
│   ├── Delegate/     # DelegateTemplate
│   ├── Flow/         # FlowTemplate
│   └── Maestro/      # MaestroTemplate + Canvas, Grid, GridItem
├── lib/
│   └── index.ts      # cn(), get(), deepEqual()
└── styles/
    └── tailwind.css   # Main CSS entry (imports theme files)
```
