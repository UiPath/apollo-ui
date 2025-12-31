# @uipath/apollo-wind Agent Consumer Guide

Guide for AI agents consuming the @uipath/apollo-wind design system package.

## Core Principle

**Always use React components. Never write raw Tailwind classes for layout,
spacing, or component styling.**

This ensures visual consistency across all pages and templates.

---

## Installation

```bash
npm install @uipath/apollo-wind
```

```tsx
// app/layout.tsx or main entry
import '@uipath/apollo-wind/styles.css';
```

---

## Import Pattern

```tsx
// Components - single import from package root
import { Button, Card, Column, DataTable, Grid, Row } from '@uipath/apollo-wind';

// Utility - cn() for conditional classNames (rare use)
import { cn } from '@uipath/apollo-wind';

// Icons - use lucide-react (peer dependency)
import { ChevronRight, Settings, User } from 'lucide-react';
```

---

## Layout System

Use layout components instead of flex/grid Tailwind classes.

### Row (Horizontal Flex)

```tsx
<Row gap={4} align="center" justify="between">
  <span>Left</span>
  <span>Right</span>
</Row>
```

| Prop                                     | Type                                          | Description            |
| ---------------------------------------- | --------------------------------------------- | ---------------------- |
| `gap`                                    | `0-96`                                        | Space between children |
| `align`                                  | `start\|center\|end\|baseline\|stretch`       | Cross-axis alignment   |
| `justify`                                | `start\|center\|end\|between\|around\|evenly` | Main-axis alignment    |
| `wrap`                                   | `nowrap\|wrap\|wrap-reverse`                  | Flex wrap              |
| `p`, `px`, `py`, `pt`, `pb`, `pl`, `pr`  | `0-96`                                        | Padding                |
| `m`, `mx`, `my`, `mt`, `mb`, `ml`, `mr`  | `0-96`                                        | Margin                 |
| `w`, `h`, `minW`, `maxW`, `minH`, `maxH` | Size value                                    | Dimensions             |
| `flex`                                   | `string\|number`                              | Flex grow/shrink       |

### Column (Vertical Flex)

```tsx
<Column gap={2} align="stretch">
  <div>Item 1</div>
  <div>Item 2</div>
</Column>
```

Same props as Row.

### Grid

```tsx
<Grid cols={3} gap={4}>
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>
```

| Prop                  | Type             | Description              |
| --------------------- | ---------------- | ------------------------ |
| `cols`                | `number\|string` | Column count or template |
| `rows`                | `number\|string` | Row count or template    |
| `gap`, `gapX`, `gapY` | `0-96`           | Gap between items        |

---

## Components Reference Table

| Component         | Description               | Key Props                                                                                                                                                                                |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**        |                           |                                                                                                                                                                                          |
| `Row`             | Horizontal flex container | `gap`, `align`, `justify`, `wrap`, `p`, `m`, `w`, `h`                                                                                                                                    |
| `Column`          | Vertical flex container   | `gap`, `align`, `justify`, `wrap`, `p`, `m`, `w`, `h`                                                                                                                                    |
| `Grid`            | CSS grid container        | `cols`, `rows`, `gap`, `gapX`, `gapY`                                                                                                                                                    |
| **Buttons**       |                           |                                                                                                                                                                                          |
| `Button`          | Clickable button          | `variant`: default\|secondary\|outline\|ghost\|link\|destructive, `size`: default\|sm\|lg\|icon, `asChild`                                                                               |
| `ButtonGroup`     | Groups buttons together   | `orientation`: horizontal\|vertical                                                                                                                                                      |
| `Toggle`          | Toggle button             | `pressed`, `onPressedChange`, `variant`                                                                                                                                                  |
| `ToggleGroup`     | Group of toggles          | `type`: single\|multiple, `value`, `onValueChange`                                                                                                                                       |
| **Form Inputs**   |                           |                                                                                                                                                                                          |
| `Input`           | Text input                | `type`, `value`, `onChange`, `placeholder`, `disabled`                                                                                                                                   |
| `Textarea`        | Multi-line text           | `value`, `onChange`, `rows`, `placeholder`                                                                                                                                               |
| `Select`          | Dropdown select           | `value`, `onValueChange`. Children: `SelectTrigger`, `SelectContent`, `SelectItem`                                                                                                       |
| `Combobox`        | Searchable select         | `items`, `value`, `onValueChange`, `placeholder`, `searchPlaceholder`                                                                                                                    |
| `MultiSelect`     | Multiple selection        | `options`, `selected`, `onChange`, `placeholder`                                                                                                                                         |
| `Checkbox`        | Binary checkbox           | `checked`, `onCheckedChange`, `disabled`                                                                                                                                                 |
| `RadioGroup`      | Radio button group        | `value`, `onValueChange`. Children: `RadioGroupItem`                                                                                                                                     |
| `Switch`          | Toggle switch             | `checked`, `onCheckedChange`, `disabled`                                                                                                                                                 |
| `Slider`          | Range slider              | `value`, `onValueChange`, `min`, `max`, `step`                                                                                                                                           |
| `DatePicker`      | Single date picker        | `value`, `onValueChange`, `placeholder`                                                                                                                                                  |
| `DateRangePicker` | Date range picker         | `value`, `onValueChange`                                                                                                                                                                 |
| `DateTimePicker`  | Date + time picker        | `value`, `onValueChange`, `use12Hour`                                                                                                                                                    |
| `FileUpload`      | Drag-and-drop upload      | `accept`, `multiple`, `maxSize`, `onFilesChange`                                                                                                                                         |
| `Search`          | Search input              | `value`, `onChange`, `onClear`, `placeholder`                                                                                                                                            |
| `Label`           | Form label                | `htmlFor`                                                                                                                                                                                |
| **Data Display**  |                           |                                                                                                                                                                                          |
| `Card`            | Container card            | Children: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                                                                                                      |
| `StatsCard`       | Metrics card              | `title`, `value`, `trend`, `description`, `icon`, `variant`                                                                                                                              |
| `DataTable`       | Full data table           | `columns`, `data`, `searchKey`, `showPagination`, `showColumnToggle`, `compact`                                                                                                          |
| `Table`           | Base table                | Children: `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`                                                                                                               |
| `Badge`           | Status indicator          | `variant`: default\|secondary\|outline\|destructive                                                                                                                                      |
| `Avatar`          | User image                | Children: `AvatarImage`, `AvatarFallback`                                                                                                                                                |
| `Progress`        | Progress bar              | `value` (0-100)                                                                                                                                                                          |
| `Skeleton`        | Loading placeholder       | `className` for sizing                                                                                                                                                                   |
| `Spinner`         | Loading spinner           | `size`, `className`                                                                                                                                                                      |
| `EmptyState`      | No data placeholder       | `icon`, `title`, `description`, `action`, `secondaryAction`                                                                                                                              |
| **Overlays**      |                           |                                                                                                                                                                                          |
| `Dialog`          | Modal dialog              | `open`, `onOpenChange`. Children: `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`                                                   |
| `AlertDialog`     | Confirmation dialog       | `open`, `onOpenChange`. Children: `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` |
| `Sheet`           | Side panel                | Children: `SheetTrigger`, `SheetContent` (`side`: left\|right\|top\|bottom), `SheetHeader`, `SheetTitle`                                                                                 |
| `Drawer`          | Bottom sheet (mobile)     | Children: `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerFooter`                                                                                                |
| `Popover`         | Floating content          | Children: `PopoverTrigger`, `PopoverContent`                                                                                                                                             |
| `Tooltip`         | Hover tooltip             | Children: `TooltipTrigger`, `TooltipContent`                                                                                                                                             |
| `HoverCard`       | Rich hover content        | Children: `HoverCardTrigger`, `HoverCardContent`                                                                                                                                         |
| `Alert`           | Inline alert              | `variant`: default\|destructive. Children: `AlertTitle`, `AlertDescription`                                                                                                              |
| `Toaster`         | Toast container           | Place in root layout. Use `toast()` from sonner                                                                                                                                          |
| **Navigation**    |                           |                                                                                                                                                                                          |
| `Tabs`            | Horizontal tabs           | `value`, `onValueChange`. Children: `TabsList`, `TabsTrigger`, `TabsContent`                                                                                                             |
| `Breadcrumb`      | Path navigation           | Children: `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`                                                                                  |
| `Pagination`      | Page navigation           | Children: `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`                                                                                |
| `Stepper`         | Step indicator            | `steps`, `currentStep`, `orientation`: horizontal\|vertical, `onStepClick`                                                                                                               |
| `NavigationMenu`  | Header navigation         | Children: `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`                                                                                   |
| **Menus**         |                           |                                                                                                                                                                                          |
| `DropdownMenu`    | Click menu                | Children: `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuCheckboxItem`                                                          |
| `ContextMenu`     | Right-click menu          | Children: `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`                                                                                                                  |
| `Command`         | Command palette           | Children: `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`                                                                                                   |
| `Menubar`         | Application menu          | Children: `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`                                                                                                               |
| **Utility**       |                           |                                                                                                                                                                                          |
| `Accordion`       | Collapsible sections      | `type`: single\|multiple. Children: `AccordionItem`, `AccordionTrigger`, `AccordionContent`                                                                                              |
| `Collapsible`     | Show/hide content         | `open`, `onOpenChange`. Children: `CollapsibleTrigger`, `CollapsibleContent`                                                                                                             |
| `ScrollArea`      | Custom scrollbar          | `className`. Children: `ScrollBar`                                                                                                                                                       |
| `Separator`       | Visual divider            | `orientation`: horizontal\|vertical                                                                                                                                                      |
| `ResizablePanel`  | Resizable panels          | Use with `ResizablePanelGroup`, `ResizableHandle`                                                                                                                                        |
| `AspectRatio`     | Maintain aspect ratio     | `ratio`                                                                                                                                                                                  |
| `Calendar`        | Calendar display          | `selected`, `onSelect`, `mode`: single\|multiple\|range                                                                                                                                  |

---

## Components Usage Examples

### Buttons

```tsx
// Variants: default, secondary, outline, ghost, link, destructive
// Sizes: default, sm, lg, icon
<Button variant="outline" size="sm">Click</Button>
<Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>

// Button as link
<Button asChild><a href="/page">Go</a></Button>

// Grouped buttons
<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Body content</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Metrics card
<StatsCard
  title="Revenue"
  value="$12,345"
  trend={{ value: 12, direction: "up" }}
  description="vs last month"
/>
```

### Forms

```tsx
// Text input
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" value={v} onChange={e => setV(e.target.value)} />

// Select
<Select value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>

// Searchable select
<Combobox
  items={[{ value: "1", label: "One" }, { value: "2", label: "Two" }]}
  value={v}
  onValueChange={setV}
/>

// Multi-select
<MultiSelect
  options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
  selected={selected}
  onChange={setSelected}
/>

// Checkbox / Switch
<Checkbox checked={v} onCheckedChange={setV} />
<Switch checked={v} onCheckedChange={setV} />

// Date pickers
<DatePicker value={date} onValueChange={setDate} />
<DateRangePicker value={range} onValueChange={setRange} />
```

### Data Display

```tsx
// Badge variants: default, secondary, outline, destructive
<Badge variant="secondary">Draft</Badge>

// DataTable with sorting, search, pagination
<DataTable
  columns={columns}
  data={data}
  searchKey="name"
  showPagination
/>

// Empty state
<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="No items"
  description="Get started by creating your first item."
  action={{ label: "Create", onClick: handleCreate }}
/>

// Loading states
<Skeleton className="h-4 w-full" />
<Spinner />
```

### Overlays

```tsx
// Modal dialog
<Dialog open={open} onOpenChange={setOpen}>
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

// Confirmation dialog
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// Side panel
<Sheet>
  <SheetTrigger asChild><Button>Open</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader><SheetTitle>Panel Title</SheetTitle></SheetHeader>
    {/* content */}
  </SheetContent>
</Sheet>

// Toast notifications
import { toast } from "sonner";
toast.success("Saved!");
toast.error("Failed", { description: "Try again" });
```

### Navigation

```tsx
// Tabs
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="a">Tab A</TabsTrigger>
    <TabsTrigger value="b">Tab B</TabsTrigger>
  </TabsList>
  <TabsContent value="a">Content A</TabsContent>
  <TabsContent value="b">Content B</TabsContent>
</Tabs>

// Stepper
<Stepper
  steps={[{ title: "Step 1" }, { title: "Step 2" }, { title: "Step 3" }]}
  currentStep={1}
/>

// Breadcrumb
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Current</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Menus

```tsx
// Dropdown menu
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Tooltip
<Tooltip>
  <TooltipTrigger asChild><Button size="icon"><Info /></Button></TooltipTrigger>
  <TooltipContent>Helpful info</TooltipContent>
</Tooltip>
```

---

## Common Patterns

### Page Layout

```tsx
<Column minH="screen">
  <header className="border-b">
    <Row justify="between" align="center" className="h-14 px-6">
      <span className="font-semibold">App Name</span>
      <Avatar />
    </Row>
  </header>

  <main className="flex-1 p-6">
    <Column gap={6} className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Page Title</h1>
      {/* content */}
    </Column>
  </main>
</Column>
```

### Form Layout

```tsx
<form className="grid gap-4 max-w-md">
  <Column gap={2}>
    <Label htmlFor="name">Name</Label>
    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
  </Column>
  <Column gap={2}>
    <Label>Category</Label>
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Option A</SelectItem>
      </SelectContent>
    </Select>
  </Column>
  <Button type="submit">Save</Button>
</form>
```

### Card Grid

```tsx
<Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>{item.description}</CardContent>
    </Card>
  ))}
</Grid>
```

### DataTable with Actions

```tsx
const columns: ColumnDef<Item>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: 'status',
    cell: ({ row }) => <Badge>{row.getValue('status')}</Badge>,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

<DataTable columns={columns} data={items} searchKey="name" showPagination />;
```

---

## Rules

### Do

- Use `Row`, `Column`, `Grid` for all layout
- Use component props (`gap`, `align`, `justify`) for spacing/alignment
- Use `Button`, `Card`, `Badge` for UI elements
- Use semantic color classes: `text-muted-foreground`, `bg-muted`,
  `text-destructive`
- Use `cn()` only for conditional classes

### Don't

- Don't use raw `flex`, `grid`, `gap-*`, `p-*`, `m-*` Tailwind classes
- Don't create custom button/card styles
- Don't hardcode colors (`text-gray-500`, `bg-blue-600`)
- Don't use inline styles for layout
- Don't recreate existing components

---

## Icon Sizing

```tsx
// Standard sizes
<Icon className="h-4 w-4" />  // Small (buttons, inline)
<Icon className="h-5 w-5" />  // Medium (cards)
<Icon className="h-6 w-6" />  // Large (headers)
<Icon className="h-12 w-12" /> // Extra large (empty states)
```

---

## Semantic Colors

| Token                   | Use                   |
| ----------------------- | --------------------- |
| `text-foreground`       | Primary text          |
| `text-muted-foreground` | Secondary/helper text |
| `text-destructive`      | Error/danger text     |
| `bg-background`         | Page background       |
| `bg-muted`              | Subtle background     |
| `bg-accent`             | Hover/active states   |
| `border-border`         | Default borders       |

---

## Metadata Forms

For complex, data-driven forms use the `MetadataForm` system. Forms are defined
as JSON schemas and rendered automatically with validation, conditional logic,
and multi-step support.

### Import

```tsx
import { MetadataForm } from '@uipath/apollo-wind';
import type { FormSchema } from '@uipath/apollo-wind';
```

### Basic Form

```tsx
const schema: FormSchema = {
  id: 'contact-form',
  title: 'Contact Us',
  sections: [
    {
      id: 'info',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          validation: { required: true, minLength: 2 },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          validation: { required: true, email: true },
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Message',
          rows: 4,
          validation: { required: true, minLength: 10 },
        },
      ],
    },
  ],
};

<MetadataForm schema={schema} onSubmit={handleSubmit} />;
```

### Field Types

| Type          | Description           | Extra Props                   |
| ------------- | --------------------- | ----------------------------- |
| `text`        | Single-line input     | `placeholder`                 |
| `email`       | Email with validation | `placeholder`                 |
| `textarea`    | Multi-line input      | `rows`, `placeholder`         |
| `number`      | Numeric input         | `min`, `max`, `step`          |
| `select`      | Dropdown              | `options`, `dataSource`       |
| `multiselect` | Multi-select          | `options`, `maxSelected`      |
| `radio`       | Radio group           | `options`                     |
| `checkbox`    | Single checkbox       | -                             |
| `switch`      | Toggle switch         | -                             |
| `slider`      | Range slider          | `min`, `max`, `step`          |
| `date`        | Date picker           | `placeholder`                 |
| `datetime`    | Date + time picker    | `use12Hour`                   |
| `file`        | File upload           | `accept`, `multiple`          |
| `custom`      | Custom component      | `component`, `componentProps` |

### Validation

Validation is JSON-serializable (no Zod in schema):

```tsx
{
  name: "password",
  type: "text",
  label: "Password",
  validation: {
    required: true,
    minLength: 8,
    pattern: "^(?=.*[A-Z])(?=.*[0-9]).*$",
    messages: {
      minLength: "Password must be at least 8 characters",
      pattern: "Must contain uppercase and number"
    }
  }
}
```

| Constraint                | Type      | Description           |
| ------------------------- | --------- | --------------------- |
| `required`                | `boolean` | Field is required     |
| `minLength` / `maxLength` | `number`  | String length         |
| `pattern`                 | `string`  | Regex pattern         |
| `email` / `url`           | `boolean` | Format validation     |
| `min` / `max`             | `number`  | Number range          |
| `integer`                 | `boolean` | Must be integer       |
| `minItems` / `maxItems`   | `number`  | Array length          |
| `messages`                | `object`  | Custom error messages |

### Multi-Step Forms

```tsx
const schema: FormSchema = {
  id: "onboarding",
  title: "User Onboarding",
  steps: [
    {
      id: "personal",
      title: "Personal Info",
      sections: [{
        id: "s1",
        fields: [
          { name: "firstName", type: "text", label: "First Name" },
          { name: "lastName", type: "text", label: "Last Name" }
        ]
      }]
    },
    {
      id: "preferences",
      title: "Preferences",
      sections: [{
        id: "s2",
        fields: [
          { name: "theme", type: "select", label: "Theme", options: [...] },
          { name: "notifications", type: "switch", label: "Notifications" }
        ]
      }]
    }
  ]
};
```

### Data Sources

```tsx
// Static options
{
  name: "country",
  type: "select",
  dataSource: {
    type: "static",
    options: [
      { label: "United States", value: "US" },
      { label: "Canada", value: "CA" }
    ]
  }
}

// Remote fetch
{
  name: "users",
  type: "select",
  dataSource: {
    type: "fetch",
    url: "/api/users",
    transform: "data.map(u => ({ label: u.name, value: u.id }))"
  }
}

// Dependent (cascading)
{
  name: "state",
  type: "select",
  dataSource: {
    type: "remote",
    endpoint: "/api/states",
    params: { countryCode: "$country" }  // References country field
  }
}

// Computed
{
  name: "total",
  type: "number",
  dataSource: {
    type: "computed",
    dependency: ["quantity", "price"],
    compute: "(quantity || 0) * (price || 0)"
  }
}
```

### Conditional Rules

Show/hide fields based on other field values:

```tsx
import { RuleBuilder } from "@uipath/apollo-wind";

{
  name: "ssn",
  type: "text",
  label: "SSN",
  rules: [
    new RuleBuilder("show-ssn-for-us")
      .when("country").is("US")
      .show()
      .require()
      .build()
  ]
}

// Multiple conditions
new RuleBuilder("premium-features")
  .when("planType").in(["enterprise", "premium"])
  .useOperator("OR")
  .when("customerId").matches("^ENT-")
  .show()
  .build()

// Custom expression
{
  rules: [{
    id: "complex-rule",
    conditions: [{
      when: "",
      custom: 'age >= 18 && (status === "active" || role === "admin")'
    }],
    effects: { visible: true, required: true }
  }]
}
```

### Rule Effects

| Effect     | Type      | Description          |
| ---------- | --------- | -------------------- |
| `visible`  | `boolean` | Show/hide field      |
| `disabled` | `boolean` | Enable/disable field |
| `required` | `boolean` | Make field required  |
| `value`    | `unknown` | Set field value      |

### Plugins

Extend form behavior with plugins:

```tsx
import { analyticsPlugin, autoSavePlugin } from '@uipath/apollo-wind';

<MetadataForm
  schema={schema}
  plugins={[analyticsPlugin, autoSavePlugin]}
  onSubmit={handleSubmit}
/>;
```

| Plugin             | Description                                  |
| ------------------ | -------------------------------------------- |
| `analyticsPlugin`  | Tracks form views, interactions, submissions |
| `autoSavePlugin`   | Auto-saves drafts to localStorage            |
| `validationPlugin` | Common validators (phone, credit card, etc.) |
| `workflowPlugin`   | UiPath Orchestrator integration              |
| `auditPlugin`      | Field-level change history                   |

### Layout Options

```tsx
const schema: FormSchema = {
  id: 'my-form',
  title: 'Form',
  layout: {
    columns: 2, // Grid columns
    gap: 6, // Gap between fields
    variant: 'default', // default | compact | spacious
  },
  sections: [
    {
      id: 'main',
      title: 'Details',
      collapsible: true,
      defaultExpanded: true,
      fields: [
        {
          name: 'description',
          type: 'textarea',
          grid: { span: 2 }, // Spans both columns
        },
      ],
    },
  ],
};
```

### MetadataForm Props

| Prop        | Type             | Description        |
| ----------- | ---------------- | ------------------ |
| `schema`    | `FormSchema`     | Form definition    |
| `plugins`   | `FormPlugin[]`   | Optional plugins   |
| `onSubmit`  | `(data) => void` | Submit handler     |
| `className` | `string`         | CSS class          |
| `disabled`  | `boolean`        | Disable all fields |
