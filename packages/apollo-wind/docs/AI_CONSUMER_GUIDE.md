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
import "@uipath/apollo-wind/styles.css";
```

---

## Import Pattern

```tsx
// Components - single import from package root
import {
  Button,
  Card,
  Column,
  DataTable,
  Grid,
  Row,
} from "@uipath/apollo-wind";

// Utility - cn() for conditional classNames (rare use)
import { cn } from "@uipath/apollo-wind";

// Icons - use lucide-react (peer dependency)
import { ChevronRight, Settings, User } from "lucide-react";
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
| **Form Fields**   |                           |                                                                                                                                                                                          |
| `MetadataForm`    | Schema-driven form        | `schema`, `plugins`, `onSubmit`. The default way to build a form; see [Metadata Forms](#metadata-forms)                                                                                  |
| `FormField`       | Field stack               | Children: the parts below. Spaces them with the field rhythm; use it instead of a `div` or `space-y-*`                                                                                   |
| `FormFieldLabel`  | Field label               | `htmlFor`, `required`, `tooltip`, `tooltipAriaLabel` (a tooltip needs a `TooltipProvider` ancestor)                                                                                      |
| `FormFieldHeader` | Label row with extras     | `label`, `htmlFor`, `labelId`, `required`, `tooltip`, `leading`, `badge`, `actions`, `variant`: default\|muted                                                                           |
| `InputGroup`      | Box for control + addons  | `layout`: row\|grow\|block\|fill, `variant`: default\|ghost\|outline\|none\|agent, `error`, `errorId`. Children: `InputGroupAddon` (`align`: inline-start\|inline-end), `InputGroupRow`, `InputGroupBody` |
| `FormFieldDescription` | Helper text               | Children. Goes below the control                                                                                                                                                         |
| `FormFieldError`  | Validation message        | `id`. Uses the `text-error` token; renders nothing when empty                                                                                                                            |
| `BooleanRadioGroup` | True / False / not set    | `value`: boolean\|null, `onValueChange`, `strings`                                                                                                                                       |
| `FieldMenu`       | Mode and actions menu     | `mode`, `onSelect`, `modes`, `actions`, `modesDisabled`, `strings`                                                                                                                       |
| `ValueModeIndicator` | `=` before an expression  | `mode`, `strings`                                                                                                                                                                        |
| `InsertVariableAction` | Header variable picker    | `variables`, `onInsert`, `compact`, `strings`                                                                                                                                            |
| `AiAssistAction`  | Header AI prompt          | `onGenerate`, `hint`, `strings`                                                                                                                                                          |
| `VariableValueControl` | Variable-bound control    | `value`, `onChange`, `variables`, `strings`                                                                                                                                              |
| `PromptValueControl` | Prompt for an agent       | `value`, `onChange`, `strings`. Render in `InputGroup` with `variant="agent"` `layout="grow"`                                                                                            |
| `QuickFormField`  | Quick Form builder field  | Only where end users configure fields in a HITL Quick Form. `fieldTypes`, `renderModeControl`, `variables`, `strings`                                                                    |
| `Label`           | Bare label primitive      | `htmlFor`. For a field use `FormFieldLabel`                                                                                                                                              |
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
<Button variant="ghost" icon><Settings className="h-4 w-4" /></Button>

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

**Build forms with `MetadataForm`** (see [Metadata Forms](#metadata-forms)). Compose the anatomy
parts for a field with no form, and inside a custom control, so its label, description and message
match every other field. Never hand-roll label, description or error markup, or wrap
fields in a local shell. Localise with each component's `strings` prop (or `FormPlugin.strings`);
there is no provider.

```tsx
// One field outside a form: FormField stacks the parts with the field rhythm
<FormField>
  <FormFieldLabel htmlFor="email" required>Email</FormFieldLabel>
  <Input
    id="email"
    type="email"
    value={v}
    onChange={(e) => setV(e.target.value)}
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  <FormFieldDescription>Used for receipts only.</FormFieldDescription>
  <FormFieldError id="email-error">{error}</FormFieldError>
</FormField>

// A control with addons and header actions: InputGroup draws the box and its error
<FormField>
  <FormFieldHeader
    label="Endpoint"
    htmlFor="endpoint"
    actions={<InsertVariableAction variables={vars} onInsert={insertAtCaret} />}
  />
  <InputGroup error={error}>
    <Input id="endpoint" value={v} onChange={(e) => setV(e.target.value)} />
    <InputGroupAddon align="inline-end">.json</InputGroupAddon>
  </InputGroup>
</FormField>

// A boolean that may be unset (value: true | false | null)
<BooleanRadioGroup value={flag} onValueChange={setFlag} aria-labelledby="flag-label" />

// The controls below sit where Input sits above

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
  <TooltipTrigger asChild><Button icon><Info /></Button></TooltipTrigger>
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

A form is a `MetadataForm`: it lays out, validates and submits the fields its schema describes.
Don't assemble a `<form>` from `Label` + `Input` pairs.

```tsx
const schema: FormSchema = {
  id: "item",
  title: "Item",
  layout: { columns: 2 },
  sections: [
    {
      id: "main",
      fields: [
        { name: "name", type: "text", label: "Name", validation: { required: true } },
        { name: "category", type: "select", label: "Category", options: [{ label: "Option A", value: "a" }] },
      ],
    },
  ],
};

<MetadataForm schema={schema} onSubmit={save} />;
```

For a single field with no form (a toolbar filter, a settings row), compose the anatomy parts
shown in [Forms](#forms).

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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "status",
    cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" icon>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)}>
            Delete
          </DropdownMenuItem>
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
- Use semantic color classes: `text-muted-foreground`, `bg-muted`
- Build forms with `MetadataForm`; compose `FormField` parts for a field with no form and inside custom controls
- Show field errors with `FormFieldError` (`text-error`), never `text-destructive`
- Use `cn()` only for conditional classes

### Don't

- Don't use raw `flex`, `grid`, `gap-*`, `p-*`, `m-*` Tailwind classes
- Don't create custom button/card styles
- Don't hardcode colors (`text-gray-500`, `bg-blue-600`)
- Don't use inline styles for layout
- Don't recreate existing components
- Don't hand-roll field label, description or error markup, or wrap fields in a local shell

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
| `text-error`            | Error text            |
| `text-destructive`      | Destructive actions   |
| `bg-background`         | Page background       |
| `bg-muted`              | Subtle background     |
| `bg-accent`             | Hover/active states   |
| `border-border`         | Default borders       |

Field validation messages use `FormFieldError`, which applies `text-error`. Some themes resolve
`destructive` and `error` to different colors, so never color a field error with `text-destructive`.

---

## Metadata Forms

`MetadataForm` is the default way to build a form. Describe the fields in a JSON-serializable
`FormSchema`; the form owns their state (react-hook-form and zod), validation, rules, data
sources, layout and steps, and renders every field with the field anatomy. It has no `value` or
`onChange` prop: seed values with `schema.initialData` or a field's `defaultValue`, read them in
`onSubmit`, and watch or drive them through plugins.

### Import

```tsx
import { MetadataForm } from "@uipath/apollo-wind";
import type { FormPlugin, FormSchema } from "@uipath/apollo-wind";

// The same API from the forms sub-entry
import { MetadataForm } from "@uipath/apollo-wind/components/forms";
```

### Basic Form

```tsx
const schema: FormSchema = {
  id: "contact-form",
  title: "Contact Us",
  sections: [
    {
      id: "info",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Full Name",
          placeholder: "John Doe",
          validation: { required: true, minLength: 2 },
        },
        {
          name: "email",
          type: "email",
          label: "Email",
          validation: { required: true, email: true },
        },
        {
          name: "message",
          type: "textarea",
          label: "Message",
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

| Type          | Description                                  | Extra Props                                                                               |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `text`        | Single-line input                            | -                                                                                         |
| `email`       | Email input                                  | -                                                                                         |
| `textarea`    | Multi-line input                             | `rows`, `minRows` (autosize floor), `maxLength`                                           |
| `number`      | Numeric input                                | `min`, `max`, `step`                                                                      |
| `select`      | Dropdown                                     | `options` (or `dataSource`)                                                               |
| `multiselect` | Multi-select                                 | `options`, `maxSelected`, `emptyMessage`, `searchPlaceholder`                             |
| `radio`       | Radio group                                  | `options`                                                                                 |
| `checkbox`    | Single checkbox                              | -                                                                                         |
| `switch`      | Toggle switch                                | -                                                                                         |
| `boolean`     | True / False / not set (`BooleanRadioGroup`) | Value is `boolean \| null`                                                                |
| `slider`      | Range slider                                 | `min`, `max`, `step`, `maxRef` (`{ fromField, fallback }`, a max read from another field) |
| `date`        | Date picker                                  | -                                                                                         |
| `datetime`    | Date + time picker                           | `use12Hour`                                                                               |
| `file`        | File upload                                  | `accept`, `multiple`, `maxSize`, `showPreview`                                            |
| `string-list` | List of text rows                            | `maxItems`, `maxLength`, `minRows`, `addItemLabel`, `removeItemAriaLabel`                 |
| `custom`      | Registered component                         | `component`, `componentProps`, `valueType`: string\|number\|boolean\|string-array         |

Every field takes `name`, `label` and these base props: `placeholder`, `description`, `tooltip`,
`tooltipAriaLabel`, `ariaLabel`, `ariaDescribedBy`, `defaultValue`, `validation`, `dataSource`,
`rules` and `grid`, plus the field anatomy props `valueModes`, `headerActions`, `menuActions` and
`badge` (see [Value modes and field actions](#value-modes-and-field-actions)). There is no
per-field `disabled`: disable a field with a rule's `disabled` effect, or the whole form with
`MetadataForm`'s `disabled`.

A `custom` field renders the component registered under `component` in `FormPlugin.components`.
Without `valueType` it validates as anything, so `required` does nothing. Without value modes or
actions the component renders the whole field: compose `FormField`, `FormFieldLabel`,
`FormFieldDescription` and `FormFieldError` around its control. With them, MetadataForm renders
those parts and the component is only the control, inside the field's `InputGroup`.

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

| Constraint                | Type       | Description                                                                  |
| ------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `required`                | `boolean`  | Field is required (a value in any mode)                                      |
| `minLength` / `maxLength` | `number`   | String length                                                                |
| `pattern`                 | `string`   | Regex pattern                                                                |
| `email` / `url`           | `boolean`  | Format validation                                                            |
| `min` / `max`             | `number`   | Number range                                                                 |
| `integer`                 | `boolean`  | Must be integer                                                              |
| `positive` / `negative`   | `boolean`  | Sign of a number                                                             |
| `minItems` / `maxItems`   | `number`   | Array length                                                                 |
| `maxFileSize`             | `number`   | File size in bytes                                                           |
| `allowedTypes`            | `string[]` | MIME types or extensions (`.pdf`, `image/*`)                                 |
| `custom`                  | `string`   | Expression over this field's `value` only; cross-field logic goes in `rules` |
| `messages`                | `object`   | Custom error messages                                                        |

Validation runs in the browser as an aid to the user. Validate submitted values on the server too.

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

| Effect     | Type               | Description                                               |
| ---------- | ------------------ | --------------------------------------------------------- |
| `visible`  | `boolean`          | Show/hide field                                           |
| `disabled` | `boolean`          | Enable/disable field                                      |
| `required` | `boolean`          | Make field required                                       |
| `value`    | `unknown`          | Set field value                                           |
| `options`  | `DataSource`       | Typed on `FieldRule`, not applied by the rules engine yet |
| `validate` | `ValidationConfig` | Typed on `FieldRule`, not applied by the rules engine yet |

Rules, section and step conditions, and data-source params read a mode-aware field's fixed
(`literal`) value only. While the field is in another mode its value reads as `VALUE_MODE_OPAQUE`:
set, but equal to nothing, so it matches no condition.

### Plugins

Extend form behavior with plugins:

```tsx
import { analyticsPlugin, autoSavePlugin } from "@uipath/apollo-wind";

<MetadataForm
  schema={schema}
  plugins={[analyticsPlugin, autoSavePlugin]}
  onSubmit={handleSubmit}
/>;
```

| Plugin             | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `analyticsPlugin`  | Logs init, value changes and submit (tracking stubs)                                     |
| `autoSavePlugin`   | Saves drafts to localStorage, restores them on init, clears them on submit               |
| `validationPlugin` | Sample `validators` configs (phone, credit card, postal code)                            |
| `workflowPlugin`   | Pre-fills from and submits to `window.__workflowContext`                                 |
| `auditPlugin`      | Records field-level change history and attaches it on submit                             |
| `formattingPlugin` | Sample `customConditions` (`isBusinessHours`, `isWeekend`) and a logging `onValueChange` |

The shipped plugins are examples: most log to the console or read `window` globals. Use them as
templates and write your own for production.

`FormPlugin` keys:

| Key                                                                  | Description                                                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `version`                                                    | Identity                                                                                                                                                               |
| `onFormInit(context)`                                                | Runs once after initial data loads. `context.form` is the react-hook-form instance                                                                                     |
| `onValueChange(name, value, context)`                                | Runs on every change with the stored value (an envelope on a mode-aware field)                                                                                         |
| `onSubmit(data, context)`                                            | Transforms submitted data, plugin by plugin; return the data                                                                                                           |
| `components`                                                         | Custom controls by name, bare or as `FieldControlRegistration` `{ component, layout, variant, labelTarget, insertable }` (the control's geometry in the field anatomy) |
| `valueModes`                                                         | `{ codecs, definitions, controlRegistry, literalControls }`: host modes, codecs and per-mode controls                                                                  |
| `fieldActions`                                                       | `{ header, menu }` by id. Build with `createInsertVariableAction`, `createAiAssistAction`, `createClearAction` (`clear` is registered by default)                      |
| `strings`                                                            | `MetadataFormStrings` overrides by group: `valueModes`, `boolean`, `insertVariable`, `aiAssist`, `clear`, `validation`. Later plugins win per string                   |
| `variables`                                                          | `FormVariables`: `VariablePickerItem[]` or `({ field }) => VariablePickerItem[]`, called when a picker opens. The last plugin that gives them wins                     |
| `onFieldRegister`, `validators`, `customConditions`, `customEffects` | Typed but not called by `MetadataForm` yet                                                                                                                             |

Keep each plugin object referentially stable: declare it at module scope or memoize it. A new
plugin object rebuilds the registries and re-renders every field; a new array holding the same
plugins is fine.

### Value modes and field actions

A field opts in to value modes with `valueModes`: its value can then be written as a fixed value,
an expression, a variable or a prompt, switched from a trailing menu.

| Mode         | Title       | Control                                                     |
| ------------ | ----------- | ----------------------------------------------------------- |
| `literal`    | Fixed value | The field type's own control                                |
| `expression` | Expression  | A plain input behind an `=` indicator                       |
| `variable`   | Variable    | `VariableValueControl`, picking from `FormPlugin.variables` |
| `prompt`     | Prompt      | `PromptValueControl` in an agent-tinted `InputGroup`        |

| Key            | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `modes`        | Offered modes, in menu order. The first is an empty value's mode unless `defaultMode` is set |
| `defaultMode`  | The mode of an empty value                                                                   |
| `switchable`   | Whether the menu offers the modes. Defaults to more than one mode                            |
| `expectedType` | The value's type (`object`, `array`, ...) for the Fixed value description and the codec      |
| `indicator`    | Whether a glyph marks a non-literal value. Defaults to `true`                                |
| `controls`     | Control per mode, by name from `FormPlugin.valueModes.controlRegistry`                       |
| `codec`        | Codec name from `FormPlugin.valueModes.codecs`. Defaults to `'default'` (the envelope)       |
| `labels`       | Per-mode `{ title, description }` overrides                                                  |

Hosts add modes, or change a built-in one, in `FormPlugin.valueModes.definitions`; a new mode
needs an `icon` and a `title`.

How values are stored (default codec):

- Every write is an envelope, fixed values included: `{ $mode: "literal", value: "https://..." }`.
- A cleared value keeps its mode, `{ $mode: "expression" }`, and is never `undefined`. A field
  without value modes clears to `null`.
- A raw stored value reads as `literal`, so existing data keeps loading; the first write wraps it.
  Submit handlers, plugins and saved drafts must expect the envelope once a field adopts modes.
- Switching a non-empty value to another mode asks first; an empty value never asks.

Field actions:

- `headerActions` (such as `"insert-variable"`, `"ai-assist"`) render behind the label;
  `menuActions` (such as `"clear"`) render in the trailing menu below the modes. Ids resolve
  against `FormPlugin.fieldActions`; unregistered ids are skipped.
- Insert variable writes at the caret of a text control, otherwise it switches the field to
  `expression` or `variable` mode, asking before it replaces a value.
- `badge` adds text after the label, such as the value's type.

Any of `valueModes`, `headerActions`, `menuActions` or `badge` renders the field through
`ModeAwareField`, the field anatomy: a header with its actions, then an `InputGroup` holding the
mode glyph, the active mode's control and the trailing menu.

```tsx
import {
  createAiAssistAction,
  createInsertVariableAction,
  MetadataForm,
  type FormPlugin,
  type FormSchema,
} from "@uipath/apollo-wind";

const schema: FormSchema = {
  id: "request",
  title: "Request",
  sections: [
    {
      id: "main",
      fields: [
        {
          name: "url",
          type: "text",
          label: "URL",
          badge: "string",
          valueModes: { modes: ["literal", "expression", "variable"] },
          headerActions: ["insert-variable", "ai-assist"],
          menuActions: ["clear"],
          validation: { required: true },
        },
      ],
    },
  ],
};

// Module scope, so the plugin object stays stable
const hostPlugin: FormPlugin = {
  name: "host",
  variables: [{ id: "orderId", label: "orderId", value: "$vars.orderId" }],
  fieldActions: {
    header: {
      "insert-variable": createInsertVariableAction({}),
      "ai-assist": createAiAssistAction({
        generate: async ({ prompt }) => ({ value: await generateValue(prompt) }),
      }),
    },
  },
  strings: { clear: { label: "Clear value" } },
};

<MetadataForm schema={schema} plugins={[hostPlugin]} onSubmit={save} />;
// onSubmit receives { url: { $mode: "variable", value: "$vars.orderId" } }
```

Storybook: **Apollo Wind/Forms/Value modes**, **Apollo Wind/Forms/Field actions**,
**Apollo Wind/Forms/Metadata Form**, and the guidance page **Apollo Wind/Forms/Guidance Field Anatomy**.

### Layout Options

```tsx
const schema: FormSchema = {
  id: "my-form",
  title: "Form",
  layout: {
    columns: 2, // Grid columns
    gap: 6, // Gap between fields
    variant: "default", // default | compact | spacious
  },
  sections: [
    {
      id: "main",
      title: "Details",
      collapsible: true,
      defaultExpanded: true,
      fields: [
        {
          name: "description",
          type: "textarea",
          grid: { span: 2 }, // Spans both columns
        },
      ],
    },
  ],
};
```

### MetadataForm Props

| Prop                 | Type                              | Description                                                                                                                                                                            |
| -------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`             | `FormSchema`                      | Form definition. Compared deeply, so an inline object is fine                                                                                                                          |
| `plugins`            | `FormPlugin[]`                    | Optional plugins. Keep each plugin object stable (module constant or memoized)                                                                                                         |
| `onSubmit`           | `(data) => void \| Promise<void>` | Submit handler; gets the data after every plugin's `onSubmit`                                                                                                                          |
| `className`          | `string`                          | CSS class                                                                                                                                                                              |
| `disabled`           | `boolean`                         | Disable all fields                                                                                                                                                                     |
| `autoComplete`       | `'off' \| 'on'`                   | Browser autocomplete. Unset keeps the browser default                                                                                                                                  |
| `stepVariant`        | `'wizard' \| 'tabs'`              | Multi-step presentation. `wizard` (default): Previous/Next with Submit on the last step. `tabs`: a tab bar over one form, values and validation shared. Ignored for `sections` schemas |
| `sectionVariant`     | `'card' \| 'plain'`               | `card` (default) boxes each titled section. `plain` drops the box and divides sections with a hairline, for hosts that frame the form                                                  |
| `activeStepId`       | `string`                          | Controlled active tab (`tabs` only). An id that isn't visible shows the first tab                                                                                                      |
| `onActiveStepChange` | `(stepId: string) => void`        | Fires when a tab is selected, controlled or not                                                                                                                                        |
| `container`          | `'form' \| 'div'`                 | `div` for a host that owns submission: Enter doesn't submit and submit actions become plain buttons. Hide the action row with `actions: []` in the schema                              |
