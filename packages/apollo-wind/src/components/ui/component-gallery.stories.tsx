import type { Meta } from '@storybook/react-vite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Separator } from './separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

const meta = {
  title: 'Components/All Components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'not-reviewed' | 'needs-update' | 'in-progress' | 'ready-for-use';

enum Category {
  Core = 'Core',
  DataDisplay = 'Data Display',
  Feedback = 'Feedback',
  Layout = 'Layout',
  Navigation = 'Navigation',
  Overlays = 'Overlays',
  UiPath = 'UiPath',
  Canvas = 'Canvas',
}

interface ComponentInfo {
  name: string;
  description: string;
  storyPath: string;
  category: Category;
  status?: Status;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WIND_CATEGORIES: Category[] = [
  Category.Core,
  Category.DataDisplay,
  Category.Feedback,
  Category.Layout,
  Category.Navigation,
  Category.Overlays,
  Category.UiPath,
];

const CANVAS_CATEGORIES: Category[] = [Category.Canvas];

const ALL_CATEGORIES: Category[] = [...WIND_CATEGORIES, ...CANVAS_CATEGORIES];

const STATUS_CONFIG: Record<Status, { label: string; className: string; dot: string }> = {
  'not-reviewed': {
    label: 'Not Reviewed',
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/50',
  },
  'needs-update': {
    label: 'Needs Update',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-500',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-500',
  },
  'ready-for-use': {
    label: 'Ready For Use',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30',
    dot: 'bg-green-500',
  },
};

// ─── Component Data ───────────────────────────────────────────────────────────
// status defaults to 'not-reviewed' when omitted.
// Update a component's status as you review it:
//   'needs-update'  — visual inconsistency found, work required
//   'in-progress'   — actively being updated
//   'ready-for-use' — reviewed and approved for use

const components: ComponentInfo[] = [
  // ─── Core ────────────────────────────────────────────────────────────────
  {
    name: 'Button',
    description: 'Clickable button element',
    storyPath: 'wind-components-core-button--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Button Group',
    description: 'Grouped set of action buttons',
    storyPath: 'wind-components-core-buttongroup--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Checkbox',
    description: 'Toggle checkbox input',
    storyPath: 'wind-components-core-checkbox--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Code Block',
    description: 'Syntax-highlighted code display',
    storyPath: 'wind-components-core-code-block--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Combobox',
    description: 'Searchable select input',
    storyPath: 'wind-components-core-combobox--basic',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Date Picker',
    description: 'Date selection input',
    storyPath: 'wind-components-core-date-picker--default',
    category: Category.Core,
  },
  {
    name: 'DateTime Picker',
    description: 'Date and time input',
    storyPath: 'wind-components-core-datetime-picker--default',
    category: Category.Core,
  },
  {
    name: 'File Upload',
    description: 'File upload with drag & drop',
    storyPath: 'wind-components-core-file-upload--default',
    category: Category.Core,
  },
  {
    name: 'Input',
    description: 'Text input field',
    storyPath: 'wind-components-core-input--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Label',
    description: 'Form field label',
    storyPath: 'wind-components-core-label--default',
    category: Category.Core,
  },
  {
    name: 'Multi Select',
    description: 'Multiple selection input',
    storyPath: 'wind-components-core-multi-select--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Radio Group',
    description: 'Single selection group',
    storyPath: 'wind-components-core-radio-group--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Select',
    description: 'Dropdown selection',
    storyPath: 'wind-components-core-select--default',
    category: Category.Core,
  },
  {
    name: 'Slider',
    description: 'Range slider input',
    storyPath: 'wind-components-core-slider--basic',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Switch',
    description: 'Toggle switch',
    storyPath: 'wind-components-core-switch--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Textarea',
    description: 'Multi-line text input',
    storyPath: 'wind-components-core-textarea--default',
    category: Category.Core,
  },
  {
    name: 'Toggle',
    description: 'Toggle button',
    storyPath: 'wind-components-core-toggle--default',
    category: Category.Core,
    status: 'ready-for-use',
  },
  {
    name: 'Toggle Group',
    description: 'Toggle button group',
    storyPath: 'wind-components-core-toggle-group--default',
    category: Category.Core,
    status: 'ready-for-use',
  },

  // ─── Data Display ─────────────────────────────────────────────────────────
  {
    name: 'Accordion',
    description: 'Interactive expandable sections',
    storyPath: 'wind-components-data-display-accordion--basic',
    category: Category.DataDisplay,
    status: 'ready-for-use',
  },
  {
    name: 'Badge',
    description: 'Small status indicators',
    storyPath: 'wind-components-data-display-badge--basic',
    category: Category.DataDisplay,
  },
  {
    name: 'Calendar',
    description: 'Date selection calendar',
    storyPath: 'wind-components-data-display-calendar--default',
    category: Category.DataDisplay,
  },
  {
    name: 'Card',
    description: 'Container with content sections',
    storyPath: 'wind-components-data-display-card--default',
    category: Category.DataDisplay,
  },
  {
    name: 'Data Table',
    description: 'Sortable, filterable data table',
    storyPath: 'wind-components-data-display-data-table--basic',
    category: Category.DataDisplay,
    status: 'ready-for-use',
  },
  {
    name: 'Stats Card',
    description: 'Statistics display card',
    storyPath: 'wind-components-data-display-stats-card--default',
    category: Category.DataDisplay,
  },
  {
    name: 'Tree View',
    description: 'Hierarchical tree with expand, search, selection',
    storyPath: 'wind-components-data-display-tree-view--basic',
    category: Category.DataDisplay,
  },

  // ─── Feedback ─────────────────────────────────────────────────────────────
  {
    name: 'Alert',
    description: 'Displays a callout message',
    storyPath: 'wind-components-feedback-alert--basic-alert',
    category: Category.Feedback,
  },
  {
    name: 'Empty State',
    description: 'No content placeholder',
    storyPath: 'wind-components-feedback-empty-state--default',
    category: Category.Feedback,
  },
  {
    name: 'Progress',
    description: 'Progress indicator',
    storyPath: 'wind-components-feedback-progress--basic-progress',
    category: Category.Feedback,
    status: 'ready-for-use',
  },
  {
    name: 'Skeleton',
    description: 'Loading placeholder',
    storyPath: 'wind-components-feedback-skeleton--basic-skeleton',
    category: Category.Feedback,
    status: 'ready-for-use',
  },
  {
    name: 'Spinner',
    description: 'Loading spinner',
    storyPath: 'wind-components-feedback-spinner--default',
    category: Category.Feedback,
  },
  {
    name: 'Toast (Sonner)',
    description: 'Toast notifications',
    storyPath: 'wind-components-feedback-toast-sonner--basic-toast-types',
    category: Category.Feedback,
  },

  // ─── Layout ───────────────────────────────────────────────────────────────
  {
    name: 'Aspect Ratio',
    description: 'Content with desired ratio',
    storyPath: 'wind-components-layout-aspect-ratio--default',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Column',
    description: 'Vertical flex layout',
    storyPath: 'wind-components-layout-column--default',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Grid',
    description: 'Responsive grid layout',
    storyPath: 'wind-components-layout-grid--default',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Resizable',
    description: 'Resizable panel groups',
    storyPath: 'wind-components-layout-resizable--horizontal',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Row',
    description: 'Horizontal flex layout',
    storyPath: 'wind-components-layout-row--default',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Scroll Area',
    description: 'Custom scrollable area',
    storyPath: 'wind-components-layout-scroll-area--default',
    category: Category.Layout,
    status: 'ready-for-use',
  },
  {
    name: 'Separator',
    description: 'Content divider',
    storyPath: 'wind-components-layout-separator--horizontal',
    category: Category.Layout,
    status: 'ready-for-use',
  },

  // ─── Navigation ───────────────────────────────────────────────────────────
  {
    name: 'Breadcrumb',
    description: 'Navigation hierarchy path',
    storyPath: 'wind-components-navigation-breadcrumb--basic',
    category: Category.Navigation,
    status: 'ready-for-use',
  },
  {
    name: 'Command',
    description: 'Command palette menu',
    storyPath: 'wind-components-navigation-command--basic',
    category: Category.Navigation,
  },
  {
    name: 'Context Menu',
    description: 'Right-click contextual menu',
    storyPath: 'wind-components-navigation-context-menu--basic',
    category: Category.Navigation,
  },
  {
    name: 'Pagination',
    description: 'Page navigation',
    storyPath: 'wind-components-navigation-pagination--basic',
    category: Category.Navigation,
  },
  {
    name: 'Search',
    description: 'Search input field',
    storyPath: 'wind-components-navigation-search--default',
    category: Category.Navigation,
    status: 'ready-for-use',
  },
  {
    name: 'Stepper',
    description: 'Step progress indicator',
    storyPath: 'wind-components-navigation-stepper--default',
    category: Category.Navigation,
  },
  {
    name: 'Tabs',
    description: 'Tabbed content panels',
    storyPath: 'wind-components-navigation-tabs--basic',
    category: Category.Navigation,
  },

  // ─── Overlays ─────────────────────────────────────────────────────────────
  {
    name: 'Alert Dialog',
    description: 'Modal dialog for important actions',
    storyPath: 'wind-components-overlays-alert-dialog--basic',
    category: Category.Overlays,
  },
  {
    name: 'Dialog',
    description: 'Modal dialog window',
    storyPath: 'wind-components-overlays-dialog--basic-dialog',
    category: Category.Overlays,
  },
  {
    name: 'Drawer / Sheet',
    description: 'Sliding panel overlay',
    storyPath: 'wind-components-overlays-drawer-sheet--basic',
    category: Category.Overlays,
  },
  {
    name: 'Dropdown Menu',
    description: 'Dropdown menu list',
    storyPath: 'wind-components-overlays-dropdown--basic-dropdown',
    category: Category.Overlays,
  },
  {
    name: 'Hover Card',
    description: 'Hover preview card',
    storyPath: 'wind-components-overlays-hover-card--basic',
    category: Category.Overlays,
  },
  {
    name: 'Popover',
    description: 'Floating content panel',
    storyPath: 'wind-components-overlays-popover--basic',
    category: Category.Overlays,
  },
  {
    name: 'Tooltip',
    description: 'Hover tooltip',
    storyPath: 'wind-components-overlays-tooltip--basic',
    category: Category.Overlays,
  },

  // ─── UiPath ───────────────────────────────────────────────────────────────
  {
    name: 'Canvas',
    description: 'Interactive flow canvas container',
    storyPath: 'wind-components-uipath-canvas--default',
    category: Category.UiPath,
  },
  {
    name: 'Canvas Toolbar',
    description: 'Toolbar for canvas actions',
    storyPath: 'wind-components-uipath-canvas-toolbar--default',
    category: Category.UiPath,
  },
  {
    name: 'Chat Composer',
    description: 'Chat input with attachments and actions',
    storyPath: 'wind-components-uipath-chat-composer--default',
    category: Category.UiPath,
  },
  {
    name: 'Chat First Experience',
    description: 'Welcome screen for new chat sessions',
    storyPath: 'wind-components-uipath-chat-first-experience--default',
    category: Category.UiPath,
  },
  {
    name: 'Flow Node',
    description: 'Process flow node element',
    storyPath: 'wind-components-uipath-flow-node--default',
    category: Category.UiPath,
  },
  {
    name: 'Flow Node Expandable',
    description: 'Expandable/collapsible flow node',
    storyPath: 'wind-components-uipath-flow-node-expandable--collapsed-default',
    category: Category.UiPath,
  },
  {
    name: 'Flow Properties',
    description: 'Properties panel for flow nodes',
    storyPath: 'wind-components-uipath-flow-properties--default',
    category: Category.UiPath,
  },
  {
    name: 'Global Header',
    description: 'Application top navigation header',
    storyPath: 'wind-components-uipath-global-header--dark',
    category: Category.UiPath,
  },
  {
    name: 'Grid (Maestro)',
    description: 'Maestro-specific grid layout',
    storyPath: 'wind-components-uipath-grid-maestro--default',
    category: Category.UiPath,
  },
  {
    name: 'Hover Menu',
    description: 'Context menu appearing on hover',
    storyPath: 'wind-components-uipath-hover-menu--default',
    category: Category.UiPath,
  },
  {
    name: 'Page Header',
    description: 'Page title with breadcrumb and actions',
    storyPath: 'wind-components-uipath-page-header--title-only',
    category: Category.UiPath,
  },
  {
    name: 'Panel (Delegate)',
    description: 'Delegate application side panel',
    storyPath: 'wind-components-uipath-panel-delegate--default',
    category: Category.UiPath,
  },
  {
    name: 'Panel (Flow)',
    description: 'Flow designer side panel',
    storyPath: 'wind-components-uipath-panel-flow--default',
    category: Category.UiPath,
  },
  {
    name: 'Panel (Maestro)',
    description: 'Maestro layout panel',
    storyPath: 'wind-components-uipath-panel-maestro--left-panel',
    category: Category.UiPath,
  },
  {
    name: 'Panel (Studio)',
    description: 'Studio IDE layout panel',
    storyPath: 'wind-components-uipath-panel-studio--left-panel',
    category: Category.UiPath,
  },
  {
    name: 'Prompt Suggestions',
    description: 'AI prompt suggestion chips',
    storyPath: 'wind-components-uipath-prompt-suggestions--default',
    category: Category.UiPath,
  },
  {
    name: 'Steps View',
    description: 'AI task execution steps view',
    storyPath: 'wind-components-uipath-steps-view--default',
    category: Category.UiPath,
  },
  {
    name: 'View Toolbar',
    description: 'Toolbar for view-level controls',
    storyPath: 'wind-components-uipath-view-toolbar--default',
    category: Category.UiPath,
  },

  // ─── Canvas ───────────────────────────────────────────────────────────────
  {
    name: 'Base Canvas',
    description: 'Core interactive XY flow canvas',
    storyPath: 'canvas-canvas-basecanvas--default',
    category: Category.Canvas,
  },
  {
    name: 'Agent Flow',
    description: 'AI agent workflow canvas',
    storyPath: 'canvas-canvas-agentflow--design-mode',
    category: Category.Canvas,
  },
  {
    name: 'Hierarchical Canvas',
    description: 'Nested hierarchy canvas layout',
    storyPath: 'canvas-canvas-hierarchicalcanvas--default',
    category: Category.Canvas,
  },
  {
    name: 'Coded Agent Flow',
    description: 'Code-based agent workflow canvas',
    storyPath: 'canvas-canvas-codedagentflow--simple-flow',
    category: Category.Canvas,
  },
  {
    name: 'Base Node',
    description: 'Foundational canvas node',
    storyPath: 'canvas-canvas-basenode--default',
    category: Category.Canvas,
  },
  {
    name: 'Stage Node',
    description: 'Process stage node',
    storyPath: 'canvas-canvas-stagenode--default',
    category: Category.Canvas,
  },
  {
    name: 'Trigger Node',
    description: 'Flow start trigger node',
    storyPath: 'canvas-canvas-triggernode--default',
    category: Category.Canvas,
  },
  {
    name: 'Group Node',
    description: 'Collapsible node group container',
    storyPath: 'canvas-canvas-groupnode--default',
    category: Category.Canvas,
  },
  {
    name: 'Sticky Note',
    description: 'Annotation sticky note node',
    storyPath: 'canvas-canvas-stickynotenode--default',
    category: Category.Canvas,
  },
  {
    name: 'Task Icon',
    description: 'Task type visual indicator icon',
    storyPath: 'canvas-canvas-taskicon--default',
    category: Category.Canvas,
  },
  {
    name: 'Execution Status',
    description: 'Node execution state indicators',
    storyPath: 'canvas-canvas-executionstatusicon--default',
    category: Category.Canvas,
  },
  {
    name: 'Add Node Panel',
    description: 'Panel for inserting new nodes',
    storyPath: 'canvas-canvas-addnodepanel--preview-selection',
    category: Category.Canvas,
  },
  {
    name: 'Node Properties',
    description: 'Properties panel for selected nodes',
    storyPath: 'canvas-canvas-nodepropertiespanel--default',
    category: Category.Canvas,
  },
  {
    name: 'Node Toolbar',
    description: 'Contextual actions toolbar for nodes',
    storyPath: 'canvas-canvas-nodetoolbar--default',
    category: Category.Canvas,
  },
  {
    name: 'Collapse Config',
    description: 'Expand/collapse configuration control',
    storyPath: 'canvas-canvas-collapseconfig--default',
    category: Category.Canvas,
  },
  {
    name: 'Node Inspector',
    description: 'Debug and inspect live node state',
    storyPath: 'canvas-canvas-nodeinspector--default',
    category: Category.Canvas,
  },
  {
    name: 'Sequence Edge',
    description: 'Animated sequence connection edge',
    storyPath: 'canvas-canvas-edges-sequenceedge--default',
    category: Category.Canvas,
  },
  {
    name: 'Button Handles',
    description: 'Interactive node connection handles',
    storyPath: 'canvas-canvas-buttonhandles--default',
    category: Category.Canvas,
  },
  {
    name: 'Smart Handle',
    description: 'Intelligent connection handle',
    storyPath: 'canvas-canvas-smarthandle--default',
    category: Category.Canvas,
  },
  {
    name: 'Timeline Player',
    description: 'Execution replay timeline controls',
    storyPath: 'canvas-canvas-timelineplayer--default',
    category: Category.Canvas,
  },
];

// ─── Story Preview ────────────────────────────────────────────────────────────

const THEMES = [
  'future-dark',
  'future-light',
  'dark-hc',
  'light-hc',
  'dark',
  'light',
  'wireframe',
  'vertex',
  'canvas',
] as const;

function getBodyTheme(): string {
  return THEMES.find((t) => document.body.classList.contains(t)) ?? 'future-dark';
}

// Story renders at this fixed viewport width so components fill the thumbnail naturally.
const THUMBNAIL_VIEWPORT = 360;

function StoryPreview({ storyPath, theme }: { storyPath: string; theme: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(0.75);

  // Lazy-load when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry], observer) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scale iframe to always fill the card at THUMBNAIL_VIEWPORT width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / THUMBNAIL_VIEWPORT);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset loaded state when theme changes so iframe reloads cleanly
  useEffect(() => {
    setLoaded(false);
  }, [theme]);

  const iframeHeight = Math.ceil(160 / scale);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-muted/20">
      {active && (
        <iframe
          key={theme}
          src={`/iframe.html?id=${storyPath}&viewMode=story&globals=theme:${theme}`}
          title={storyPath}
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
          className="absolute top-0 left-0 border-none pointer-events-none"
          style={{
            width: `${THUMBNAIL_VIEWPORT}px`,
            height: `${iframeHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        />
      )}
    </div>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

const ALL_STATUSES: Status[] = ['not-reviewed', 'needs-update', 'in-progress', 'ready-for-use'];

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />;
}

function ComponentGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [theme, setTheme] = useState(getBodyTheme);
  const isFutureTheme = theme === 'future-dark' || theme === 'future-light';

  // Keep preview iframes in sync with the Storybook theme toolbar
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const next = getBodyTheme();
      setTheme(next);
      if (next !== 'future-dark' && next !== 'future-light') {
        setStatusFilter('all');
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || component.category === filter;
      const componentStatus = component.status ?? 'not-reviewed';
      const matchesStatus = statusFilter === 'all' || componentStatus === statusFilter;
      return matchesSearch && matchesFilter && matchesStatus;
    });
  }, [searchQuery, filter, statusFilter]);

  const groupedComponents = useMemo(() => {
    const grouped = Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c, [] as ComponentInfo[]])
    ) as Record<Category, ComponentInfo[]>;
    for (const component of filteredComponents) {
      grouped[component.category].push(component);
    }
    return grouped;
  }, [filteredComponents]);

  const windComponents = useMemo(
    () => WIND_CATEGORIES.flatMap((c) => groupedComponents[c]),
    [groupedComponents]
  );
  const canvasComponents = useMemo(
    () => CANVAS_CATEGORIES.flatMap((c) => groupedComponents[c]),
    [groupedComponents]
  );

  const showWindSection = filter === 'all' || WIND_CATEGORIES.includes(filter as Category);
  const showCanvasSection = filter === 'all' || CANVAS_CATEGORIES.includes(filter as Category);
  const showSectionHeaders = filter === 'all';
  const noResults = filteredComponents.length === 0;

  const renderCategorySection = (category: Category) => {
    const categoryComponents = groupedComponents[category];
    if (categoryComponents.length === 0) return null;
    return (
      <section key={category}>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold tracking-tight">{category}</h2>
          <Badge variant="secondary" className="text-xs">
            {categoryComponents.length}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryComponents.map((component) => {
            const status = component.status ?? 'not-reviewed';
            return (
              <a
                key={component.name}
                href={`/?path=/story/${component.storyPath}`}
                target="_top"
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg min-w-0"
              >
                <div className="h-full rounded-lg border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-border hover:shadow-md">
                  <div className="relative h-[160px] overflow-hidden">
                    <StoryPreview storyPath={component.storyPath} theme={theme} />
                  </div>
                  <div className="px-4 py-3 border-t border-border/30 space-y-1.5">
                    <h3 className="font-medium text-sm text-foreground leading-none">
                      {component.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {component.description}
                    </p>
                    {isFutureTheme && <StatusBadge status={status} />}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">All components</h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                {components.length} components across Wind and Canvas.
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 items-center flex-wrap">
              {/* All */}
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({components.length})
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Wind dropdown */}
              {(() => {
                const windActive = WIND_CATEGORIES.includes(filter as Category);
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={windActive ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                      >
                        {windActive ? (filter as string) : 'Wind'}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {WIND_CATEGORIES.map((category) => {
                        const count = components.filter((c) => c.category === category).length;
                        return (
                          <DropdownMenuItem key={category} onClick={() => setFilter(category)}>
                            <Check
                              className={`mr-2 h-3.5 w-3.5 ${filter === category ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {category} ({count})
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Canvas dropdown */}
              {(() => {
                const canvasActive = CANVAS_CATEGORIES.includes(filter as Category);
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={canvasActive ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                      >
                        {canvasActive ? (filter as string) : 'Canvas'}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {CANVAS_CATEGORIES.map((category) => {
                        const count = components.filter((c) => c.category === category).length;
                        return (
                          <DropdownMenuItem key={category} onClick={() => setFilter(category)}>
                            <Check
                              className={`mr-2 h-3.5 w-3.5 ${filter === category ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {category} ({count})
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}

              {isFutureTheme && <Separator orientation="vertical" className="h-6 mx-1" />}

              {/* Status dropdown — only relevant for Future themes */}
              {isFutureTheme && (() => {
                const statusActive = statusFilter !== 'all';
                const activeStatusCfg = statusActive ? STATUS_CONFIG[statusFilter as Status] : null;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={statusActive ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                      >
                        {statusActive && activeStatusCfg && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeStatusCfg.dot}`}
                          />
                        )}
                        {statusActive ? activeStatusCfg?.label : 'Status'}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        <Check
                          className={`mr-2 h-3.5 w-3.5 ${statusFilter === 'all' ? 'opacity-100' : 'opacity-0'}`}
                        />
                        All statuses
                      </DropdownMenuItem>
                      {ALL_STATUSES.map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        const count = components.filter(
                          (c) => (c.status ?? 'not-reviewed') === status
                        ).length;
                        return (
                          <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                            <Check
                              className={`mr-2 h-3.5 w-3.5 ${statusFilter === status ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <span
                              className={`mr-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}
                            />
                            {cfg.label} ({count})
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="px-8 py-10 max-w-7xl mx-auto">
        {noResults ? (
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
          <div className="space-y-16">
            {/* Wind Section */}
            {showWindSection && windComponents.length > 0 && (
              <div className="space-y-12">
                {showSectionHeaders && (
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
                      Wind
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {WIND_CATEGORIES.map(renderCategorySection)}
              </div>
            )}

            {/* Canvas Section */}
            {showCanvasSection && canvasComponents.length > 0 && (
              <div className="space-y-12">
                {showSectionHeaders && (
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
                      Canvas
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {CANVAS_CATEGORIES.map(renderCategorySection)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Default = { render: () => <ComponentGallery /> };
