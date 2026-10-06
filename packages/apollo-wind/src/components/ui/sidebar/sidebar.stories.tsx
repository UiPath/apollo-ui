import type { Meta } from '@storybook/react-vite';
import {
  Bell,
  Briefcase,
  Car,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  Eye,
  FileText,
  HeartPulse,
  Home,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  MoreHorizontal,
  PanelLeftIcon,
  Plus,
  Receipt,
  Settings,
  Shield,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback } from '../avatar';
import { Button } from '../button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible';
import { __CaseRolesTakeoverModal as CaseRolesTakeoverModal } from '../dialog.stories';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '.';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A composable left menu for app layouts and embedded panels, adapted from shadcn/ui Sidebar. ' +
          'Wrap it in `SidebarProvider`. Inside a modal or split pane, set `collapsible="none"` so it renders as a static panel, ' +
          'and pass `className="min-h-0"` to the provider, which otherwise fills the viewport height for app layouts. ' +
          'Build rows from `SidebarMenu`, `SidebarMenuItem` and `SidebarMenuButton`, and mark the selection with `isActive`. ' +
          'Icons are optional children, so render one for an icon row or leave it out for a text-only row. ' +
          'For deep data hierarchies, use Tree View instead.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Shared
// ============================================================================

/** Embedded sidebar in a bordered frame, the same setup used inside modals. */
function Frame({ children, height = 380 }: { children: React.ReactNode; height?: number }) {
  return (
    <SidebarProvider className="min-h-0 w-fit">
      <div
        className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
        style={{ height }}
      >
        <Sidebar collapsible="none">{children}</Sidebar>
      </div>
    </SidebarProvider>
  );
}

const roles = [
  { id: 'owner', name: 'Owner', meta: 'Whole case · 12 actions' },
  { id: 'worker', name: 'Worker', meta: '2 stages · 7 actions' },
  { id: 'observer', name: 'Observer', meta: 'Whole case · 2 actions' },
  { id: 'auditor', name: 'Auditor', meta: 'Whole case · 3 actions' },
];

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const roleIcons = { owner: UserCog, worker: Users, observer: Eye, auditor: ClipboardCheck };

/** Story controls. Icons are plain children, so leaving them out gives a text-only menu. */
type IconArgs = { showIcons?: boolean };

const iconArgTypes = {
  showIcons: {
    control: 'boolean',
    description:
      'Story control only. Icons are optional children of `SidebarMenuButton`: render one to show it, leave it out for a text-only row.',
  },
};

// ============================================================================
// Menu (two-line rows)
// ============================================================================

function RoleIcon({ id }: { id: string }) {
  const Icon = roleIcons[id as keyof typeof roleIcons];
  return <Icon />;
}

function MenuExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('owner');

  return (
    <Frame>
      <SidebarHeader className="flex-row items-center justify-between px-4 pt-4">
        <span className="text-sm font-semibold">Roles ({roles.length})</span>
        <Button variant="outline" size="2xs" icon aria-label="Add role">
          <Plus />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {roles.map((role) => (
              <SidebarMenuItem key={role.id}>
                <SidebarMenuButton
                  size="lg"
                  isActive={selected === role.id}
                  onClick={() => setSelected(role.id)}
                >
                  {showIcons && <RoleIcon id={role.id} />}
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{role.name}</span>
                    <span className="truncate text-xs font-normal text-foreground-muted future:in-data-[active=true]:text-foreground">
                      {role.meta}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const Menu = {
  name: 'Menu',
  parameters: {
    docs: {
      description: {
        story:
          'Two-line rows with a title and supporting detail. Use `size="lg"` and stack the text in a grid. ' +
          'The header holds the list title, a count and an add action.',
      },
    },
  },
  args: { showIcons: false },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <MenuExample {...args} />,
};

// ============================================================================
// Single line
// ============================================================================

function SingleLineExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('overview');

  return (
    <Frame>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={selected === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  {showIcons && <item.icon />}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const SingleLine = {
  name: 'Menu single line',
  parameters: {
    docs: {
      description: {
        story:
          'One line per item. Icons are optional: use the Show icons control to compare. This is the default size.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <SingleLineExample {...args} />,
};

// ============================================================================
// Dense
// ============================================================================

function DenseExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('inbox');

  return (
    <Frame height={260}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  size="sm"
                  isActive={selected === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  {showIcons && <item.icon />}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const Dense = {
  name: 'Menu dense',
  parameters: {
    docs: {
      description: {
        story: 'Compact rows for long lists or tight panels. Use `size="sm"` on each button.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <DenseExample {...args} />,
};

// ============================================================================
// Sub-menus
// ============================================================================

const stages = [
  {
    id: 'intake',
    label: 'Intake',
    icon: Inbox,
    children: ['Application received', 'Document check'],
  },
  {
    id: 'review',
    label: 'Review',
    icon: ClipboardCheck,
    children: ['Credit review', 'Risk assessment', 'Manager approval'],
  },
  { id: 'decision', label: 'Decision', icon: Shield, children: ['Approve', 'Decline'] },
];

function SubMenuExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('Credit review');

  return (
    <Frame height={420}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Stages</SidebarGroupLabel>
          <SidebarMenu>
            {stages.map((stage) => (
              <Collapsible
                key={stage.id}
                asChild
                defaultOpen={stage.children.includes(selected)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {showIcons && <stage.icon />}
                      <span>{stage.label}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {stage.children.map((child) => (
                        <SidebarMenuSubItem key={child}>
                          <SidebarMenuSubButton asChild isActive={selected === child}>
                            <button
                              type="button"
                              className="w-full"
                              onClick={() => setSelected(child)}
                            >
                              <span>{child}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const SubMenus = {
  name: 'Menu with sub-menus',
  parameters: {
    docs: {
      description: {
        story:
          'Parents expand and collapse to show one level of children. Wrap each `SidebarMenuItem` in `Collapsible` ' +
          'and put a `SidebarMenuSub` inside `CollapsibleContent`. Keep it to one level. For deeper nesting, use Tree View.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <SubMenuExample {...args} />,
};

// ============================================================================
// Dividers and groups
// ============================================================================

function DividersExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('overview');

  const renderItems = (items: typeof navItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton isActive={selected === item.id} onClick={() => setSelected(item.id)}>
          {showIcons && <item.icon />}
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Frame height={400}>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(navItems.slice(0, 3))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(navItems.slice(3))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const Dividers = {
  name: 'Menu with dividers',
  parameters: {
    docs: {
      description: {
        story:
          'Split related items into labeled groups with `SidebarGroup` and `SidebarGroupLabel`, ' +
          'and place `SidebarSeparator` between them.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <DividersExample {...args} />,
};

// ============================================================================
// Disabled
// ============================================================================

function DisabledExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('overview');

  return (
    <Frame height={360}>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selected === 'overview'}
                onClick={() => setSelected('overview')}
              >
                {showIcons && <LayoutDashboard />}
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                {showIcons && <Lock />}
                <span>Billing</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={selected === 'team'} onClick={() => setSelected('team')}>
                {showIcons && <Users />}
                <span>Team</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Requires admin access</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                {showIcons && <Shield />}
                <span>Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                {showIcons && <Settings />}
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const Disabled = {
  name: 'Menu disabled',
  parameters: {
    docs: {
      description: {
        story:
          'Set `disabled` on a button to block it, or disable every button in a group. ' +
          'When the item renders as a link through `asChild`, set `aria-disabled` instead. ' +
          'The button then blocks activation, including Enter on a focused link, and stays focusable so screen readers can announce it.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <DisabledExample {...args} />,
};

// ============================================================================
// Actions and badges
// ============================================================================

function ActionsExample({ showIcons = true }: IconArgs) {
  const [selected, setSelected] = React.useState('owner');
  const counts = { owner: 12, worker: 7, observer: 2, auditor: 3 };

  return (
    <Frame height={300}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Roles</SidebarGroupLabel>
          <SidebarGroupAction title="Add role">
            <Plus />
            <span className="sr-only">Add role</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {roles.map((role) => {
                const Icon = roleIcons[role.id as keyof typeof roleIcons];
                return (
                  <SidebarMenuItem key={role.id}>
                    <SidebarMenuButton
                      isActive={selected === role.id}
                      onClick={() => setSelected(role.id)}
                    >
                      {showIcons && <Icon />}
                      <span>{role.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{counts[role.id as keyof typeof counts]}</SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton>
                  {showIcons && <Bell />}
                  <span>Notifications</span>
                </SidebarMenuButton>
                <SidebarMenuAction showOnHover aria-label="More options for Notifications">
                  <MoreHorizontal />
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Frame>
  );
}

export const ActionsAndBadges = {
  name: 'Header actions & badges',
  parameters: {
    docs: {
      description: {
        story:
          '`SidebarGroupAction` adds a button to a group header. `SidebarMenuBadge` shows a count on a row, ' +
          'and `SidebarMenuAction` adds a per-row button. Set `showOnHover` to reveal it on hover or focus.',
      },
    },
  },
  args: { showIcons: true },
  argTypes: iconArgTypes,
  render: (args: IconArgs) => <ActionsExample {...args} />,
};

// ============================================================================
// Example layout
// ============================================================================

type BusinessApp = {
  id: string;
  name: string;
  icon: typeof Layers;
  tile: string;
  nav: { id: string; label: string; icon: typeof Layers; badge?: number }[];
};

// Tile colors use Apollo chart tokens so each app reads as distinct in every theme.
const businessApps: BusinessApp[] = [
  {
    id: 'case-management',
    name: 'Case Management',
    icon: Briefcase,
    tile: 'bg-chart-blue-secondary/15 text-chart-blue-secondary',
    nav: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'cases', label: 'Cases', icon: FileText },
      { id: 'actions', label: 'Actions', icon: Inbox, badge: 28 },
    ],
  },
  {
    id: 'auto-claims',
    name: 'Auto Claims EMEA',
    icon: Car,
    tile: 'bg-chart-green/15 text-chart-green',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'claims', label: 'Claims', icon: FileText },
      { id: 'reports', label: 'Reports', icon: ClipboardCheck },
    ],
  },
  {
    id: 'life-annuity',
    name: 'Life & Annuity',
    icon: HeartPulse,
    tile: 'bg-chart-purple/15 text-chart-purple',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'policies', label: 'Policies', icon: Shield },
    ],
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    icon: Receipt,
    tile: 'bg-chart-yellow/15 text-chart-yellow',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'invoices', label: 'Invoices', icon: Receipt, badge: 6 },
      { id: 'vendors', label: 'Vendors', icon: Users },
    ],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    icon: UserPlus,
    tile: 'bg-chart-pink/15 text-chart-pink',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'new-hires', label: 'New hires', icon: UserPlus },
    ],
  },
];

/** Expands the sidebar at 1280px and wider, and collapses it to the icon rail below that. */
function useAutoCollapse(setOpen: (open: boolean) => void) {
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 1280px)');
    const sync = () => setOpen(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [setOpen]);
}

function AppSwitcher({
  current,
  onSwitch,
}: {
  current: BusinessApp;
  onSwitch: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch business app"
          className="-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg p-1 text-left outline-hidden transition-colors hover:bg-background-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-md ${current.tile}`}
          >
            <current.icon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold leading-tight">{current.name}</span>
            <span className="truncate text-xs leading-tight text-foreground-muted">UiPath</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-foreground-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem>
          <LayoutGrid />
          <span>All business apps</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-foreground-muted">
          Business apps
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current.id} onValueChange={onSwitch}>
          {businessApps.map((app) => (
            <DropdownMenuRadioItem key={app.id} value={app.id}>
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded ${app.tile}`}
              >
                <app.icon className="size-3" />
              </span>
              <span className="ml-2 truncate">{app.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExampleSidebarHeader({
  current,
  hovered,
  onSwitch,
}: {
  current: BusinessApp;
  hovered: boolean;
  onSwitch: (id: string) => void;
}) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  // The mobile sheet always shows the full header; only the desktop rail collapses.
  const collapsed = !isMobile && state === 'collapsed';

  return (
    <SidebarHeader className="px-4 pt-6 pb-0">
      <div className="flex h-7 items-center justify-between pt-4">
        {collapsed ? (
          // Collapsed: the app tile turns into the expand control while the rail is hovered.
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={toggleSidebar}
                className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${current.tile}`}
              >
                {hovered ? (
                  <PanelLeftIcon className="size-4" />
                ) : (
                  <current.icon className="size-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Open sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <AppSwitcher current={current} onSwitch={onSwitch} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  icon
                  aria-label="Collapse sidebar"
                  className="ml-2 shrink-0 text-foreground-muted"
                  onClick={toggleSidebar}
                >
                  <PanelLeftIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </SidebarHeader>
  );
}

function ExampleUserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu for Jordan Lee"
          className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg p-1 text-left outline-hidden transition-colors hover:bg-background-hover focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:p-0"
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>JL</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Jordan Lee</span>
            <span className="truncate text-xs text-foreground-muted">jordan.lee@example.com</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem>
          <UserCog />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExampleLayoutDemo() {
  const [open, setOpen] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const [appId, setAppId] = React.useState(businessApps[0].id);
  const app = businessApps.find((item) => item.id === appId) ?? businessApps[0];
  const [selected, setSelected] = React.useState(app.nav[0].id);
  const [rolesOpen, setRolesOpen] = React.useState(true);
  const page = app.nav.find((item) => item.id === selected) ?? app.nav[0];

  useAutoCollapse(setOpen);

  const switchApp = (id: string) => {
    const next = businessApps.find((item) => item.id === id) ?? businessApps[0];
    setAppId(next.id);
    setSelected(next.nav[0].id);
  };

  return (
    <SidebarProvider
      keyboardShortcut
      open={open}
      onOpenChange={setOpen}
      className="h-svh overflow-hidden"
      style={{ '--sidebar-width': '280px', '--sidebar-width-icon': '4rem' } as React.CSSProperties}
    >
      <Sidebar
        collapsible="icon"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <ExampleSidebarHeader current={app} hovered={hovered} onSwitch={switchApp} />
        <SidebarContent className="mt-10 px-4 pt-0 pb-3">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {app.nav.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={selected === item.id}
                      // Matches the Maestro case app, which bolds the current page.
                      className="data-[active=true]:font-semibold"
                      onClick={() => setSelected(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge != null && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 pt-0">
          <ExampleUserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* Below 768px the sidebar becomes a sheet, opened from this bar. */}
        <header className="flex h-12 items-center border-b border-border-subtle px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 pt-6 pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">{page.label}</h1>
                <p className="text-sm text-foreground-muted">{app.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRolesOpen(true)}>
                Manage roles
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {['Open actions', 'Overdue actions', 'Due this week'].map((label) => (
                <div key={label} className="h-[106px] rounded-xl border border-border-subtle p-5">
                  <p className="text-sm text-foreground-muted">{label}</p>
                </div>
              ))}
            </div>
            <div className="min-h-[360px] rounded-xl border border-border-subtle p-5">
              <p className="text-sm text-foreground-muted">
                Page content. Resize below 1280px to collapse the sidebar to its icon rail, hover
                the rail to reveal the expand control, or press Cmd/Ctrl+B.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
      <CaseRolesTakeoverModal open={rolesOpen} onOpenChange={setRolesOpen} />
    </SidebarProvider>
  );
}

export const ExampleLayout = {
  name: 'Example layout',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'An app shell based on the Maestro case app: a 280px sidebar that collapses to a 64px icon rail. ' +
          'It expands at 1280px and wider and collapses below that, and opens as a sheet below 768px. ' +
          'The header switches between business apps, and each app brings its own navigation. ' +
          'While collapsed, hovering the rail turns the app tile into the expand control. ' +
          'The takeover modal opens on top. Close it to see the app underneath.',
      },
    },
  },
  render: () => <ExampleLayoutDemo />,
};
