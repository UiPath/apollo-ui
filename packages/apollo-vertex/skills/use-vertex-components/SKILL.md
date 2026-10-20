---
name: use-vertex-components
description: >
  Build all new UI from @uipath/apollo-vertex components instead of writing
  new ones. Covers which Vertex component to use for common needs (buttons,
  forms, dialogs, tables, page headers, empty states, charts, toasts), how to
  adapt them with variants, className and composition, and what not to do:
  hand-rolled primitives, raw Radix or other UI libraries, or copied shadcn
  code. Load before building or changing any UI in an app that uses Apollo
  Vertex.
metadata:
  type: core
  library: '@uipath/apollo-vertex'
sources:
  - 'UiPath/apollo-ui:packages/apollo-vertex/entries/index.ts'
  - 'UiPath/apollo-ui:packages/apollo-vertex/registry/**/*.tsx'
---

# Use Apollo Vertex components

Apollo Vertex is the component library for this app. Build every new screen,
form and widget out of its components. Do not write replacements for Vertex
components.

## Rules

1. Before writing any markup that renders a control, surface or feedback
   element, find the Vertex component for it and import it from
   `@uipath/apollo-vertex`.
2. If a Vertex component almost fits, adapt it with its props, `variant`,
   `size`, `className` or `asChild`. Do not fork or copy it.
3. If no single component fits, compose several Vertex components. A new
   app-level component is fine only when it is built from Vertex components
   and adds app logic, not new styling of basic elements.
4. Never build your own button, input, select, dialog, menu, tooltip, table,
   tabs, card or similar primitive. Never add another UI library (MUI, Chakra,
   Ant Design, Headless UI) or raw Radix primitives, and never copy shadcn/ui
   source into the app.
5. If you are sure Vertex has nothing for the need, stop and tell the user what
   is missing before building it.

## Pick the component

| Need | Use |
| --- | --- |
| Actions | `Button`, `ButtonGroup`, `Toggle`, `ToggleGroup` |
| Text and choice inputs | `Input`, `InputGroup`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `InputOTP` |
| Dates | `DatePicker`, `Calendar` |
| Form layout, labels and errors | `Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `Label` |
| Multi-step forms | `FormWizard`, `Stepper` |
| Overlays | `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, `HoverCard`, `Tooltip` |
| Menus | `DropdownMenu`, `ContextMenu`, `Menubar`, `Command`, `NavigationMenu` |
| Page structure | `PageHeader`, `Breadcrumb`, `Tabs`, `Card`, `Separator`, `ResizablePanelGroup`, `ScrollArea`, `Sidebar` |
| Lists and tables | `DataTable` with `useDataTable`, `Table`, `Item`, `Pagination` |
| Status and feedback | `Badge`, `Alert`, `Toaster`, `Progress`, `Spinner`, `Skeleton`, `Empty` |
| Metrics and charts | `MetricCard`, plus `BarChart`, `LineChart`, `KpiChart` and the other charts |
| AI content | `AiMark`, `AiGlow`, `AiCaveat`, `ConfidenceSignal`, `FeedbackVoteWidget` |
| Misc | `Avatar`, `Accordion`, `Collapsible`, `Carousel`, `TimelineRowLayout`, `Kbd`, `AspectRatio` |

Import all of them from `@uipath/apollo-vertex`.

## Adapting a component

Use the built-in variants first:

```tsx
import { Button } from "@uipath/apollo-vertex";

<Button variant="destructive-outline" size="sm">Delete</Button>
```

Use `className` for layout and spacing, and `cn()` from the package when classes
must merge or override:

```tsx
import { Card, CardContent, cn } from "@uipath/apollo-vertex";

<Card className={cn("w-full", isSelected && "border-primary")}>
  <CardContent>...</CardContent>
</Card>
```

Use `asChild` to give a router link the look of a Vertex component:

```tsx
<Button asChild variant="link">
  <Link to="/invoices">Invoices</Link>
</Button>
```

Use the theme's semantic tokens (`bg-primary`, `text-muted-foreground`,
`border-destructive`) rather than raw colors such as `bg-blue-500` or hex values.

## Common Mistakes

### CRITICAL Writing a new primitive

Wrong:

```tsx
function PrimaryButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button className="rounded-md bg-blue-600 px-4 py-2 text-white" {...props}>
      {children}
    </button>
  );
}
```

Correct:

```tsx
import { Button } from "@uipath/apollo-vertex";

<Button>Save</Button>
```

A hand-rolled control drifts from the design system and misses its focus,
dark mode and accessibility behavior.

### CRITICAL Bringing in another UI library or raw Radix

Wrong:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
```

Correct:

```tsx
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@uipath/apollo-vertex";
```

The raw primitive has none of the Vertex styling.

### HIGH Copying a Vertex or shadcn component to change it

Wrong: copying the `Badge` source into `src/components/my-badge.tsx` to add a
color.

Correct: use an existing `variant`, or pass `className`. If neither is enough,
tell the user the variant is missing.

A copy stops getting fixes and theme updates from the package.

### HIGH Building an empty or loading state by hand

Wrong:

```tsx
<div className="flex flex-col items-center p-8 text-gray-500">No invoices yet</div>
```

Correct:

```tsx
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@uipath/apollo-vertex";

<Empty>
  <EmptyHeader>
    <EmptyTitle>No invoices yet</EmptyTitle>
    <EmptyDescription>Invoices you create appear here.</EmptyDescription>
  </EmptyHeader>
</Empty>
```

Use `Skeleton` or `Spinner` for loading and `Alert` for errors in the same way.
