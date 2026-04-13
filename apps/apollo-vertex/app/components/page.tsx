import Link from "next/link";

const components: { slug: string; name: string; description: string }[] = [
  {
    slug: "accordion",
    name: "Accordion",
    description: "Vertically stacked set of interactive headings.",
  },
  {
    slug: "alert",
    name: "Alert",
    description: "Displays a callout for important information.",
  },
  {
    slug: "alert-dialog",
    name: "Alert Dialog",
    description: "A modal dialog that interrupts the user.",
  },
  {
    slug: "aspect-ratio",
    name: "Aspect Ratio",
    description: "Displays content within a desired ratio.",
  },
  {
    slug: "avatar",
    name: "Avatar",
    description: "An image element with a fallback.",
  },
  {
    slug: "badge",
    name: "Badge",
    description: "Displays a small status indicator.",
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description: "Navigation trail showing the current location.",
  },
  {
    slug: "button",
    name: "Button",
    description: "Displays a button or a component that looks like a button.",
  },
  {
    slug: "button-group",
    name: "Button Group",
    description: "Groups related buttons together.",
  },
  {
    slug: "calendar",
    name: "Calendar",
    description: "A date field component for picking dates.",
  },
  {
    slug: "card",
    name: "Card",
    description: "Displays content in a contained card layout.",
  },
  {
    slug: "carousel",
    name: "Carousel",
    description: "A component for cycling through elements.",
  },
  {
    slug: "chart",
    name: "Chart",
    description: "Data visualization components.",
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description: "A control that allows selecting multiple options.",
  },
  {
    slug: "collapsible",
    name: "Collapsible",
    description: "An interactive component that expands and collapses.",
  },
  {
    slug: "combobox",
    name: "Combobox",
    description: "Autocomplete input with a dropdown list.",
  },
  {
    slug: "command",
    name: "Command",
    description: "A command menu for searching and executing actions.",
  },
  {
    slug: "context-menu",
    name: "Context Menu",
    description: "A menu triggered by right-click.",
  },
  {
    slug: "data-table",
    name: "Data Table",
    description: "A powerful table with sorting, filtering, and pagination.",
  },
  {
    slug: "date-picker",
    name: "Date Picker",
    description: "A component for selecting dates.",
  },
  {
    slug: "dialog",
    name: "Dialog",
    description: "A modal window overlaid on the primary content.",
  },
  {
    slug: "drawer",
    name: "Drawer",
    description: "A panel that slides in from the edge.",
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    description: "A menu of actions triggered by a button.",
  },
  {
    slug: "empty",
    name: "Empty",
    description: "Placeholder for empty states.",
  },
  {
    slug: "feature-flags",
    name: "Feature Flags",
    description: "Conditionally render content based on feature flags.",
  },
  {
    slug: "field",
    name: "Field",
    description: "A form field wrapper with label and error handling.",
  },
  {
    slug: "filter-dropdown",
    name: "Filter Dropdown",
    description: "A dropdown for applying filters.",
  },
  {
    slug: "form",
    name: "Form",
    description: "Building forms with validation.",
  },
  {
    slug: "hover-card",
    name: "Hover Card",
    description: "A card that appears on hover.",
  },
  { slug: "input", name: "Input", description: "A text input field." },
  {
    slug: "input-group",
    name: "Input Group",
    description: "Groups related input elements together.",
  },
  {
    slug: "input-otp",
    name: "Input OTP",
    description: "One-time password input field.",
  },
  { slug: "item", name: "Item", description: "A generic list item component." },
  { slug: "kbd", name: "Kbd", description: "Displays keyboard shortcuts." },
  {
    slug: "label",
    name: "Label",
    description: "Renders an accessible label for form controls.",
  },
  {
    slug: "menubar",
    name: "Menubar",
    description: "A horizontal menu bar with dropdowns.",
  },
  {
    slug: "metric-card",
    name: "Metric Card",
    description: "Displays a key metric with label and value.",
  },
  {
    slug: "navigation-menu",
    name: "Navigation Menu",
    description: "A collection of navigation links.",
  },
  {
    slug: "pagination",
    name: "Pagination",
    description: "Controls for navigating between pages.",
  },
  {
    slug: "popover",
    name: "Popover",
    description: "A floating panel anchored to a trigger.",
  },
  {
    slug: "progress",
    name: "Progress",
    description: "Displays a progress indicator.",
  },
  {
    slug: "radio-group",
    name: "Radio Group",
    description: "A set of checkable buttons where only one can be selected.",
  },
  {
    slug: "resizable",
    name: "Resizable",
    description: "Resizable panel groups and layouts.",
  },
  {
    slug: "scroll-area",
    name: "Scroll Area",
    description: "Custom scrollbar component.",
  },
  {
    slug: "select",
    name: "Select",
    description: "A dropdown for selecting a single option.",
  },
  {
    slug: "separator",
    name: "Separator",
    description: "Visually separates content.",
  },
  {
    slug: "sheet",
    name: "Sheet",
    description: "A panel that slides in from the side.",
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    description: "A collapsible side navigation component.",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "A placeholder for loading content.",
  },
  {
    slug: "slider",
    name: "Slider",
    description: "An input for selecting a value from a range.",
  },
  { slug: "sonner", name: "Sonner", description: "Toast notifications." },
  {
    slug: "spinner",
    name: "Spinner",
    description: "A loading spinner indicator.",
  },
  {
    slug: "switch",
    name: "Switch",
    description: "A toggle between two states.",
  },
  {
    slug: "table",
    name: "Table",
    description: "A responsive table component.",
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Organizes content into switchable panels.",
  },
  {
    slug: "textarea",
    name: "Textarea",
    description: "A multi-line text input.",
  },
  { slug: "toggle", name: "Toggle", description: "A two-state button." },
  {
    slug: "toggle-group",
    name: "Toggle Group",
    description: "A group of toggle buttons.",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description: "A popup that displays information on hover.",
  },
];

export const metadata = {
  title: "Components",
};

export default function ComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Components</h1>
      <p className="text-muted-foreground mb-8">
        Browse all available components in the Apollo Vertex design system.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((component) => (
          <Link
            key={component.slug}
            href={`/components/${component.slug}`}
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
          >
            <h2 className="font-semibold text-card-foreground group-hover:text-primary">
              {component.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {component.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
