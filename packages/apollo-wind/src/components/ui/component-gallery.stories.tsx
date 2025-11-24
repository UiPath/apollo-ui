import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./layout/grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Slider } from "./slider";
import { Progress } from "./progress";
import { Spinner } from "./spinner";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Calendar } from "./calendar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./breadcrumb";

const meta = {
  title: "Design System/All Components",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface ComponentInfo {
  name: string;
  description: string;
  storyPath: string;
  category: string;
  preview: React.ReactNode;
}

const components: ComponentInfo[] = [
  {
    name: "Accordion",
    description: "Interactive expandable sections",
    storyPath: "design-system-data-display-accordion--default",
    category: "Data Display",
    preview: (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    name: "Alert",
    description: "Displays a callout message",
    storyPath: "design-system-feedback-alert--default",
    category: "Feedback",
    preview: (
      <Alert>
        <AlertTitle>Alert</AlertTitle>
        <AlertDescription>This is an alert message</AlertDescription>
      </Alert>
    ),
  },
  {
    name: "Alert Dialog",
    description: "Modal dialog for important actions",
    storyPath: "design-system-overlays-alert-dialog--default",
    category: "Overlays",
    preview: <Button variant="outline">Show Dialog</Button>,
  },
  {
    name: "Aspect Ratio",
    description: "Content with desired ratio",
    storyPath: "design-system-layout-aspect-ratio--default",
    category: "Layout",
    preview: (
      <div className="w-full aspect-video bg-muted rounded flex items-center justify-center text-xs">
        16:9
      </div>
    ),
  },
  {
    name: "Badge",
    description: "Small status indicators",
    storyPath: "design-system-data-display-badge--default",
    category: "Data Display",
    preview: (
      <div className="flex gap-2 flex-wrap">
        <Badge>Badge</Badge>
        <Badge variant="secondary">New</Badge>
      </div>
    ),
  },
  {
    name: "Breadcrumb",
    description: "Navigation hierarchy path",
    storyPath: "design-system-navigation-breadcrumb--default",
    category: "Navigation",
    preview: (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Docs</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  {
    name: "Button",
    description: "Clickable button element",
    storyPath: "design-system-core-button--default",
    category: "Core",
    preview: (
      <div className="flex gap-2">
        <Button size="sm">Click me</Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
      </div>
    ),
  },
  {
    name: "Calendar",
    description: "Date selection calendar",
    storyPath: "design-system-data-display-calendar--default",
    category: "Data Display",
    preview: <Calendar mode="single" className="scale-75 origin-top-left" />,
  },
  {
    name: "Card",
    description: "Container with content sections",
    storyPath: "design-system-data-display-card--default",
    category: "Data Display",
    preview: (
      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Card Title</CardTitle>
          <CardDescription className="text-xs">Card description</CardDescription>
        </CardHeader>
      </Card>
    ),
  },
  {
    name: "Checkbox",
    description: "Toggle checkbox input",
    storyPath: "design-system-forms-checkbox--default",
    category: "Forms",
    preview: (
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <label htmlFor="terms" className="text-xs">
          Accept terms
        </label>
      </div>
    ),
  },
  {
    name: "Collapsible",
    description: "Expandable content panel",
    storyPath: "design-system-data-display-collapsible--default",
    category: "Data Display",
    preview: (
      <Button variant="outline" size="sm">
        Toggle
      </Button>
    ),
  },
  {
    name: "Combobox",
    description: "Searchable select input",
    storyPath: "design-system-forms-combobox--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Open Combobox
      </Button>
    ),
  },
  {
    name: "Command",
    description: "Command palette menu",
    storyPath: "design-system-navigation-command--default",
    category: "Navigation",
    preview: (
      <Button variant="outline" size="sm">
        Command Menu
      </Button>
    ),
  },
  {
    name: "Context Menu",
    description: "Right-click menu",
    storyPath: "design-system-overlays-context-menu--default",
    category: "Overlays",
    preview: <div className="border rounded p-2 text-xs text-center">Right click me</div>,
  },
  {
    name: "Data Table",
    description: "Powerful data table",
    storyPath: "design-system-data-display-data-table--default",
    category: "Data Display",
    preview: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs h-8">Name</TableHead>
            <TableHead className="text-xs h-8">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-xs h-8">Item</TableCell>
            <TableCell className="text-xs h-8">Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  {
    name: "Date Picker",
    description: "Date selection input",
    storyPath: "design-system-forms-date-picker--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Pick a date
      </Button>
    ),
  },
  {
    name: "DateTime Picker",
    description: "Date and time input",
    storyPath: "design-system-forms-datetime-picker--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Pick date & time
      </Button>
    ),
  },
  {
    name: "Dialog",
    description: "Modal dialog window",
    storyPath: "design-system-overlays-dialog--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Open Dialog
      </Button>
    ),
  },
  {
    name: "Drawer",
    description: "Sliding side panel",
    storyPath: "design-system-overlays-drawer--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Open Drawer
      </Button>
    ),
  },
  {
    name: "Dropdown Menu",
    description: "Dropdown menu list",
    storyPath: "design-system-overlays-dropdown-menu--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Open Menu
      </Button>
    ),
  },
  {
    name: "Empty State",
    description: "No content placeholder",
    storyPath: "design-system-feedback-empty-state--default",
    category: "Feedback",
    preview: <div className="text-center p-4 text-muted-foreground text-xs">No items found</div>,
  },
  {
    name: "File Upload",
    description: "File upload with drag & drop",
    storyPath: "design-system-forms-file-upload--default",
    category: "Forms",
    preview: (
      <div className="border-2 border-dashed rounded p-4 text-xs text-center">Drop files here</div>
    ),
  },
  {
    name: "Grid",
    description: "Responsive grid layout",
    storyPath: "design-system-layout-grid--default",
    category: "Layout",
    preview: (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-6 bg-muted rounded"></div>
        <div className="h-6 bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: "Row",
    description: "Horizontal flex layout",
    storyPath: "design-system-layout-row--default",
    category: "Layout",
    preview: (
      <div className="flex gap-2">
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: "Column",
    description: "Vertical flex layout",
    storyPath: "design-system-layout-column--default",
    category: "Layout",
    preview: (
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: "Hover Card",
    description: "Hover preview card",
    storyPath: "design-system-overlays-hover-card--default",
    category: "Overlays",
    preview: <span className="underline text-xs">Hover me</span>,
  },
  {
    name: "Input",
    description: "Text input field",
    storyPath: "design-system-forms-input--default",
    category: "Forms",
    preview: <Input placeholder="Type here..." className="h-8 text-xs" />,
  },
  {
    name: "Label",
    description: "Form field label",
    storyPath: "design-system-forms-label--default",
    category: "Forms",
    preview: <label className="text-xs font-medium">Label</label>,
  },
  {
    name: "Menubar",
    description: "Desktop-style menu bar",
    storyPath: "design-system-navigation-menubar--default",
    category: "Navigation",
    preview: (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          File
        </Button>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </div>
    ),
  },
  {
    name: "Multi Select",
    description: "Multiple selection input",
    storyPath: "design-system-forms-multi-select--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Select items
      </Button>
    ),
  },
  {
    name: "Navigation Menu",
    description: "Navigation menu with dropdowns",
    storyPath: "design-system-navigation-navigation-menu--default",
    category: "Navigation",
    preview: (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Home
        </Button>
        <Button variant="ghost" size="sm">
          About
        </Button>
      </div>
    ),
  },
  {
    name: "Pagination",
    description: "Page navigation",
    storyPath: "design-system-navigation-pagination--default",
    category: "Navigation",
    preview: (
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
      </div>
    ),
  },
  {
    name: "Popover",
    description: "Floating content panel",
    storyPath: "design-system-overlays-popover--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Open Popover
      </Button>
    ),
  },
  {
    name: "Progress",
    description: "Progress indicator",
    storyPath: "design-system-feedback-progress--default",
    category: "Feedback",
    preview: <Progress value={60} className="w-full" />,
  },
  {
    name: "Radio Group",
    description: "Single selection group",
    storyPath: "design-system-forms-radio-group--default",
    category: "Forms",
    preview: (
      <div className="flex gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full border" />
          <span>Option 1</span>
        </div>
      </div>
    ),
  },
  {
    name: "Resizable",
    description: "Resizable panel groups",
    storyPath: "design-system-layout-resizable--default",
    category: "Layout",
    preview: (
      <div className="flex gap-1 h-12">
        <div className="flex-1 bg-muted rounded" />
        <div className="w-1 bg-border" />
        <div className="flex-1 bg-muted rounded" />
      </div>
    ),
  },
  {
    name: "Scroll Area",
    description: "Custom scrollable area",
    storyPath: "design-system-layout-scroll-area--default",
    category: "Layout",
    preview: (
      <div className="h-16 border rounded p-2 overflow-hidden text-xs">Scrollable content area</div>
    ),
  },
  {
    name: "Search",
    description: "Search input field",
    storyPath: "design-system-forms-search--default",
    category: "Forms",
    preview: <Input placeholder="Search..." className="h-8 text-xs" />,
  },
  {
    name: "Select",
    description: "Dropdown selection",
    storyPath: "design-system-forms-select--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Select option
      </Button>
    ),
  },
  {
    name: "Separator",
    description: "Content divider",
    storyPath: "design-system-layout-separator--default",
    category: "Layout",
    preview: <Separator className="w-full" />,
  },
  {
    name: "Sheet",
    description: "Side panel overlay",
    storyPath: "design-system-overlays-sheet--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Open Sheet
      </Button>
    ),
  },
  {
    name: "Skeleton",
    description: "Loading placeholder",
    storyPath: "design-system-feedback-skeleton--default",
    category: "Feedback",
    preview: (
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    ),
  },
  {
    name: "Slider",
    description: "Range slider input",
    storyPath: "design-system-forms-slider--default",
    category: "Forms",
    preview: <Slider defaultValue={[50]} max={100} step={1} className="w-full" />,
  },
  {
    name: "Sonner",
    description: "Toast notifications",
    storyPath: "design-system-feedback-sonner--default",
    category: "Feedback",
    preview: <div className="border rounded p-2 text-xs">Toast notification</div>,
  },
  {
    name: "Spinner",
    description: "Loading spinner",
    storyPath: "design-system-feedback-spinner--default",
    category: "Feedback",
    preview: <Spinner className="w-6 h-6" />,
  },
  {
    name: "Stats Card",
    description: "Statistics display card",
    storyPath: "design-system-data-display-stats-card--default",
    category: "Data Display",
    preview: (
      <Card className="w-full">
        <CardHeader className="p-4">
          <CardDescription className="text-xs">Total Users</CardDescription>
          <CardTitle className="text-lg">1,234</CardTitle>
        </CardHeader>
      </Card>
    ),
  },
  {
    name: "Stepper",
    description: "Step progress indicator",
    storyPath: "design-system-navigation-stepper--default",
    category: "Navigation",
    preview: (
      <div className="flex gap-1">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
          1
        </div>
        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">
          2
        </div>
      </div>
    ),
  },
  {
    name: "Switch",
    description: "Toggle switch",
    storyPath: "design-system-forms-switch--default",
    category: "Forms",
    preview: (
      <div className="flex items-center gap-2">
        <Switch />
        <span className="text-xs">Enable</span>
      </div>
    ),
  },
  {
    name: "Table",
    description: "Data table",
    storyPath: "design-system-data-display-table--default",
    category: "Data Display",
    preview: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs h-8">Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-xs h-8">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  {
    name: "Tabs",
    description: "Tabbed content panels",
    storyPath: "design-system-navigation-tabs--default",
    category: "Navigation",
    preview: (
      <Tabs defaultValue="tab1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tab1" className="text-xs">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" className="text-xs">
            Tab 2
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ),
  },
  {
    name: "Textarea",
    description: "Multi-line text input",
    storyPath: "design-system-forms-textarea--default",
    category: "Forms",
    preview: (
      <textarea
        placeholder="Type here..."
        className="w-full h-16 text-xs border rounded p-2 resize-none"
      />
    ),
  },
  {
    name: "Toggle",
    description: "Toggle button",
    storyPath: "design-system-forms-toggle--default",
    category: "Forms",
    preview: (
      <Button variant="outline" size="sm">
        Toggle
      </Button>
    ),
  },
  {
    name: "Toggle Group",
    description: "Toggle button group",
    storyPath: "design-system-forms-toggle-group--default",
    category: "Forms",
    preview: (
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          Left
        </Button>
        <Button variant="outline" size="sm">
          Right
        </Button>
      </div>
    ),
  },
  {
    name: "Tooltip",
    description: "Hover tooltip",
    storyPath: "design-system-overlays-tooltip--default",
    category: "Overlays",
    preview: (
      <Button variant="outline" size="sm">
        Hover me
      </Button>
    ),
  },
];

const getCategoryColor = (
  category: string,
): "default" | "secondary" | "outline" | "destructive" => {
  const colorMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    Forms: "default",
    Layout: "secondary",
    "Data Display": "outline",
    Navigation: "default",
    Overlays: "secondary",
    Feedback: "outline",
    Core: "destructive",
  };
  return colorMap[category] || "default";
};

export const Default: Story = {
  render: () => {
    const categories = Array.from(new Set(components.map((c) => c.category)));

    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            All components by category
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
            Components organized by their primary purpose and use case.
          </p>
        </div>

        {categories.map((category) => {
          const categoryComponents = components.filter((c) => c.category === category);

          return (
            <div key={category} style={{ marginBottom: "3rem" }}>
              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>{category}</h2>
                <Badge variant={getCategoryColor(category)}>{categoryComponents.length}</Badge>
              </div>

              <Grid cols={4} gap={4}>
                {categoryComponents.map((component) => (
                  <a
                    key={component.name}
                    href={`/?path=/story/${component.storyPath}`}
                    target="_top"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                      height: "100%",
                    }}
                  >
                    <Card
                      style={{
                        height: "100%",
                        transition: "all 0.2s ease-in-out",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      <CardContent className="p-4">
                        <div
                          className="mb-4 rounded border bg-muted/50 flex items-center justify-center"
                          style={{ minHeight: "160px" }}
                        >
                          <div className="w-full px-2">{component.preview}</div>
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm leading-tight">{component.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {component.description}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </Grid>
            </div>
          );
        })}
      </div>
    );
  },
};
