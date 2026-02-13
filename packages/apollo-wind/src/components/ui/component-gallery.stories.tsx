import type { Meta } from '@storybook/react-vite';
import { useState, useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { Slider } from './slider';
import { Progress } from './progress';
import { Spinner } from './spinner';
import { Separator } from './separator';
import { Skeleton } from './skeleton';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Calendar } from './calendar';
import { Search } from 'lucide-react';

const meta = {
  title: 'Components/All Components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

enum Category {
  Core = 'Core',
  DataDisplay = 'Data Display',
  Layout = 'Layout',
  Navigation = 'Navigation',
  Overlays = 'Overlays',
  Feedback = 'Feedback',
}

const CATEGORY_ORDER: Category[] = [
  Category.Core,
  Category.DataDisplay,
  Category.Layout,
  Category.Navigation,
  Category.Overlays,
  Category.Feedback,
];

interface ComponentInfo {
  name: string;
  description: string;
  storyPath: string;
  category: Category;
  preview: React.ReactNode;
}

const components: ComponentInfo[] = [
  {
    name: 'Accordion',
    description: 'Interactive expandable sections',
    storyPath: 'components-data-display-accordion--docs',
    category: Category.DataDisplay,
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
    name: 'Alert',
    description: 'Displays a callout message',
    storyPath: 'components-feedback-alert--docs',
    category: Category.Feedback,
    preview: (
      <Alert>
        <AlertTitle>Alert</AlertTitle>
        <AlertDescription>This is an alert message</AlertDescription>
      </Alert>
    ),
  },
  {
    name: 'Alert Dialog',
    description: 'Modal dialog for important actions',
    storyPath: 'components-overlays-alert-dialog--docs',
    category: Category.Overlays,
    preview: <Button variant="outline">Show Dialog</Button>,
  },
  {
    name: 'Aspect Ratio',
    description: 'Content with desired ratio',
    storyPath: 'components-layout-aspect-ratio--docs',
    category: Category.Layout,
    preview: (
      <div className="w-full aspect-video bg-muted rounded flex items-center justify-center text-xs">
        16:9
      </div>
    ),
  },
  {
    name: 'Badge',
    description: 'Small status indicators',
    storyPath: 'components-data-display-badge--docs',
    category: Category.DataDisplay,
    preview: (
      <div className="flex gap-2 flex-wrap">
        <Badge>Badge</Badge>
        <Badge variant="secondary">New</Badge>
      </div>
    ),
  },
  {
    name: 'Breadcrumb',
    description: 'Navigation hierarchy path',
    storyPath: 'components-navigation-breadcrumb--docs',
    category: Category.Navigation,
    preview: (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hover:text-foreground cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-foreground cursor-pointer">Docs</span>
        <span>/</span>
        <span className="text-foreground">Page</span>
      </div>
    ),
  },
  {
    name: 'Button',
    description: 'Clickable button element',
    storyPath: 'components-core-button--docs',
    category: Category.Core,
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
    name: 'Calendar',
    description: 'Date selection calendar',
    storyPath: 'components-data-display-calendar--docs',
    category: Category.DataDisplay,
    preview: <Calendar mode="single" className="scale-75 origin-top-left" />,
  },
  {
    name: 'Card',
    description: 'Container with content sections',
    storyPath: 'components-data-display-card--docs',
    category: Category.DataDisplay,
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
    name: 'Checkbox',
    description: 'Toggle checkbox input',
    storyPath: 'components-core-checkbox--docs',
    category: Category.Core,
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
    name: 'Combobox',
    description: 'Searchable select input',
    storyPath: 'components-core-combobox--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Open Combobox
      </Button>
    ),
  },
  {
    name: 'Command',
    description: 'Command palette menu',
    storyPath: 'components-navigation-command--docs',
    category: Category.Navigation,
    preview: (
      <Button variant="outline" size="sm">
        Command Menu
      </Button>
    ),
  },
  {
    name: 'Context Menu',
    description: 'Right-click menu',
    storyPath: 'components-navigation-context-menu--docs',
    category: Category.Overlays,
    preview: <div className="border rounded p-2 text-xs text-center">Right click me</div>,
  },
  {
    name: 'Data Table',
    description: 'Powerful data table',
    storyPath: 'components-data-display-data-table--docs',
    category: Category.DataDisplay,
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
    name: 'Date Picker',
    description: 'Date selection input',
    storyPath: 'components-core-date-picker--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Pick a date
      </Button>
    ),
  },
  {
    name: 'DateTime Picker',
    description: 'Date and time input',
    storyPath: 'components-core-datetime-picker--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Pick date & time
      </Button>
    ),
  },
  {
    name: 'Dialog',
    description: 'Modal dialog window',
    storyPath: 'components-overlays-dialog--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Open Dialog
      </Button>
    ),
  },
  {
    name: 'Drawer',
    description: 'Sliding side panel',
    storyPath: 'components-overlays-drawer-sheet--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Open Drawer
      </Button>
    ),
  },
  {
    name: 'Dropdown Menu',
    description: 'Dropdown menu list',
    storyPath: 'components-overlays-dropdown--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Open Menu
      </Button>
    ),
  },
  {
    name: 'Empty State',
    description: 'No content placeholder',
    storyPath: 'components-feedback-empty-state--docs',
    category: Category.Feedback,
    preview: <div className="text-center p-4 text-muted-foreground text-xs">No items found</div>,
  },
  {
    name: 'File Upload',
    description: 'File upload with drag & drop',
    storyPath: 'components-core-file-upload--docs',
    category: Category.Core,
    preview: (
      <div className="border-2 border-dashed rounded p-4 text-xs text-center">Drop files here</div>
    ),
  },
  {
    name: 'Grid',
    description: 'Responsive grid layout',
    storyPath: 'components-layout-grid--docs',
    category: Category.Layout,
    preview: (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: 'Row',
    description: 'Horizontal flex layout',
    storyPath: 'components-layout-row--docs',
    category: Category.Layout,
    preview: (
      <div className="flex gap-2">
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: 'Column',
    description: 'Vertical flex layout',
    storyPath: 'components-layout-column--docs',
    category: Category.Layout,
    preview: (
      <div className="flex flex-col gap-2">
        <div className="h-4 w-12 bg-muted rounded"></div>
        <div className="h-4 w-12 bg-muted rounded"></div>
      </div>
    ),
  },
  {
    name: 'Hover Card',
    description: 'Hover preview card',
    storyPath: 'components-overlays-hover-card--docs',
    category: Category.Overlays,
    preview: <span className="underline text-xs">Hover me</span>,
  },
  {
    name: 'Input',
    description: 'Text input field',
    storyPath: 'components-core-input--docs',
    category: Category.Core,
    preview: <Input placeholder="Type here..." className="h-8 text-xs" />,
  },
  {
    name: 'Label',
    description: 'Form field label',
    storyPath: 'components-core-label--docs',
    category: Category.Core,
    preview: <label className="text-xs font-medium">Label</label>,
  },
  {
    name: 'Multi Select',
    description: 'Multiple selection input',
    storyPath: 'components-core-multi-select--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Select items
      </Button>
    ),
  },
  {
    name: 'Pagination',
    description: 'Page navigation',
    storyPath: 'components-navigation-pagination--docs',
    category: Category.Navigation,
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
    name: 'Popover',
    description: 'Floating content panel',
    storyPath: 'components-overlays-popover--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Open Popover
      </Button>
    ),
  },
  {
    name: 'Progress',
    description: 'Progress indicator',
    storyPath: 'components-feedback-progress--docs',
    category: Category.Feedback,
    preview: <Progress value={60} className="w-20" />,
  },
  {
    name: 'Radio Group',
    description: 'Single selection group',
    storyPath: 'components-core-radio-group--docs',
    category: Category.Core,
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
    name: 'Resizable',
    description: 'Resizable panel groups',
    storyPath: 'components-layout-resizable--docs',
    category: Category.Layout,
    preview: (
      <div className="flex gap-1 h-12">
        <div className="flex-1 bg-muted rounded" />
        <div className="w-1 bg-border" />
        <div className="flex-1 bg-muted rounded" />
      </div>
    ),
  },
  {
    name: 'Scroll Area',
    description: 'Custom scrollable area',
    storyPath: 'components-layout-scroll-area--docs',
    category: Category.Layout,
    preview: (
      <div className="h-16 border rounded p-2 overflow-hidden text-xs">Scrollable content area</div>
    ),
  },
  {
    name: 'Search',
    description: 'Search input field',
    storyPath: 'components-navigation-search--docs',
    category: Category.Core,
    preview: <Input placeholder="Search..." className="h-8 text-xs" />,
  },
  {
    name: 'Select',
    description: 'Dropdown selection',
    storyPath: 'components-core-select--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Select option
      </Button>
    ),
  },
  {
    name: 'Separator',
    description: 'Content divider',
    storyPath: 'components-layout-separator--docs',
    category: Category.Layout,
    preview: <Separator className="w-12" />,
  },
  {
    name: 'Sheet',
    description: 'Side panel overlay',
    storyPath: 'components-overlays-drawer-sheet--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Open Sheet
      </Button>
    ),
  },
  {
    name: 'Skeleton',
    description: 'Loading placeholder',
    storyPath: 'components-feedback-skeleton--docs',
    category: Category.Feedback,
    preview: (
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    ),
  },
  {
    name: 'Slider',
    description: 'Range slider input',
    storyPath: 'components-core-slider--docs',
    category: Category.Core,
    preview: <Slider defaultValue={[50]} max={100} step={1} className="w-full" />,
  },
  {
    name: 'Sonner',
    description: 'Toast notifications',
    storyPath: 'components-feedback-toast-sonner--docs',
    category: Category.Feedback,
    preview: <div className="border rounded p-2 text-xs">Toast notification</div>,
  },
  {
    name: 'Spinner',
    description: 'Loading spinner',
    storyPath: 'components-feedback-spinner--docs',
    category: Category.Feedback,
    preview: <Spinner className="w-6 h-6" />,
  },
  {
    name: 'Stats Card',
    description: 'Statistics display card',
    storyPath: 'components-data-display-stats-card--docs',
    category: Category.DataDisplay,
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
    name: 'Stepper',
    description: 'Step progress indicator',
    storyPath: 'components-navigation-stepper--docs',
    category: Category.Navigation,
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
    name: 'Switch',
    description: 'Toggle switch',
    storyPath: 'components-core-switch--docs',
    category: Category.Core,
    preview: (
      <div className="flex items-center gap-2">
        <Switch />
        <span className="text-xs">Enable</span>
      </div>
    ),
  },
  {
    name: 'Table',
    description: 'Data table',
    storyPath: 'components-data-display-table--docs',
    category: Category.DataDisplay,
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
    name: 'Tree View',
    description: 'Hierarchical tree with expand, search, selection',
    storyPath: 'components-data-display-tree-view--docs',
    category: Category.DataDisplay,
    preview: (
      <div className="w-full space-y-1 text-xs">
        <div className="flex items-center gap-1 pl-0">
          <span className="text-muted-foreground">▸</span>
          <span>Folder</span>
        </div>
        <div className="flex items-center gap-1 pl-4">
          <span className="text-muted-foreground">▸</span>
          <span>Subfolder</span>
        </div>
        <div className="flex items-center gap-1 pl-8 text-muted-foreground">File</div>
      </div>
    ),
  },
  {
    name: 'Tabs',
    description: 'Tabbed content panels',
    storyPath: 'components-navigation-tabs--docs',
    category: Category.Navigation,
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
    name: 'Textarea',
    description: 'Multi-line text input',
    storyPath: 'components-core-textarea--docs',
    category: Category.Core,
    preview: (
      <textarea
        placeholder="Type here..."
        className="w-full h-16 text-xs border rounded p-2 resize-none"
      />
    ),
  },
  {
    name: 'Toggle',
    description: 'Toggle button',
    storyPath: 'components-core-toggle--docs',
    category: Category.Core,
    preview: (
      <Button variant="outline" size="sm">
        Toggle
      </Button>
    ),
  },
  {
    name: 'Toggle Group',
    description: 'Toggle button group',
    storyPath: 'components-core-toggle-group--docs',
    category: Category.Core,
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
    name: 'Tooltip',
    description: 'Hover tooltip',
    storyPath: 'components-overlays-tooltip--docs',
    category: Category.Overlays,
    preview: (
      <Button variant="outline" size="sm">
        Hover me
      </Button>
    ),
  },
];

function ComponentGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedComponents = useMemo(() => {
    const grouped: Record<Category, typeof components> = {
      [Category.Core]: [],
      [Category.DataDisplay]: [],
      [Category.Layout]: [],
      [Category.Navigation]: [],
      [Category.Overlays]: [],
      [Category.Feedback]: [],
    };
    filteredComponents.forEach((component) => {
      grouped[component.category].push(component);
    });
    return grouped;
  }, [filteredComponents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                All components
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                Explore the collection of {components.length} beautifully crafted, accessible
                components built with React and Tailwind CSS.
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="transition-all duration-200"
                >
                  All ({components.length})
                </Button>
                {CATEGORY_ORDER.map((category) => {
                  const count = components.filter((c) => c.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="transition-all duration-200"
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="px-8 py-10 max-w-7xl mx-auto">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No components found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {CATEGORY_ORDER.map((category) => {
              const categoryComponents = groupedComponents[category];
              if (categoryComponents.length === 0) return null;

              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">{category}</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryComponents.map((component) => (
                      <a
                        key={component.name}
                        href={`/?path=/story/${component.storyPath}`}
                        target="_top"
                        className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg min-w-0"
                      >
                        <div className="h-full rounded-lg border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-border hover:shadow-md">
                          {/* Preview Area - fixed height */}
                          <div className="h-[140px] bg-muted/30 flex items-center justify-center p-4">
                            <div className="max-w-full">{component.preview}</div>
                          </div>

                          {/* Component Info */}
                          <div className="px-4 py-3 border-t border-border/30">
                            <h3 className="font-medium text-sm text-foreground">
                              {component.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {component.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const Default = {
  args: {},
  render: () => <ComponentGallery />,
};
