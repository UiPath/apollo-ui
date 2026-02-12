import type { Meta } from '@storybook/react-vite';
import {
  Calendar,
  ExternalLink,
  FileText,
  GitBranch,
  MapPin,
  MoreHorizontal,
  Star,
  Users,
} from 'lucide-react';
import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { Separator } from './separator';

const meta: Meta<typeof HoverCard> = {
  title: 'Components/Overlays/Hover Card',
  component: HoverCard,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover here</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            AP
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Apollo Design System</h4>
            <p className="text-sm text-muted-foreground">
              Open-source component library for UiPath — built with Radix UI and Tailwind CSS.
            </p>
            <div className="flex items-center gap-1 pt-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Created January 2025</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

// ============================================================================
// Sides
// ============================================================================

export const Sides = {
  name: 'Sides',
  render: () => (
    <div className="flex items-center justify-center gap-8 py-20">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline" size="sm">Top</Button>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-60">
          <p className="text-sm">This card opens above the trigger element.</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline" size="sm">Bottom</Button>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" className="w-60">
          <p className="text-sm">This card opens below the trigger element.</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline" size="sm">Left</Button>
        </HoverCardTrigger>
        <HoverCardContent side="left" className="w-60">
          <p className="text-sm">This card opens to the left of the trigger element.</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline" size="sm">Right</Button>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-60">
          <p className="text-sm">This card opens to the right of the trigger element.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

// ============================================================================
// Examples — Panels
// ============================================================================

export const Panels = {
  name: 'Panels',
  render: () => (
    <div className="flex gap-6">
      {/* User card */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              JC
            </div>
            <span>Jane Cooper</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              JC
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Jane Cooper</h4>
              <p className="text-xs text-muted-foreground">Senior Engineer · Platform Team</p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              San Francisco, CA
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joined Jan 2023
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3" />
              12 projects
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-3 w-3" />
              4.9 rating
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* Repo card */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span>apollo-ui</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">uipath/apollo-ui</h4>
              <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">Public</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Open-source design system for UiPath. Unified component library for React and Web Components.
            </p>
            <Separator />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                TypeScript
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                248
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                42
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

// ============================================================================
// Examples — Data Tables
// ============================================================================

export const DataTables = {
  name: 'Data Tables',
  render: () => {
    const rows = [
      { id: 'PRJ-001', name: 'Website Redesign', owner: 'Jane C.', status: 'Active', updated: 'Feb 10', desc: 'Complete overhaul of the marketing website with new brand guidelines and improved UX.' },
      { id: 'PRJ-002', name: 'Mobile App v2', owner: 'Alex M.', status: 'Paused', updated: 'Feb 8', desc: 'Second major version of the iOS and Android apps with offline support.' },
      { id: 'PRJ-003', name: 'API Migration', owner: 'Sam W.', status: 'Active', updated: 'Feb 5', desc: 'Migrate REST endpoints to GraphQL with backward compatibility layer.' },
    ];

    return (
      <div className="w-[550px] rounded-lg border">
        {/* Header */}
        <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground">
          <span className="w-[70px]">ID</span>
          <span className="flex-1">Project</span>
          <span className="w-[70px]">Owner</span>
          <span className="w-[70px]">Status</span>
        </div>
        {/* Rows */}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-4 border-b last:border-0 px-4 py-2.5 text-sm">
            <span className="w-[70px] tabular-nums text-muted-foreground">{row.id}</span>
            <span className="flex-1">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button type="button" className="font-medium underline-offset-4 hover:underline text-left">
                    {row.name}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-72" side="right">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{row.name}</h4>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        row.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                    <Separator />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Owner: {row.owner}</span>
                      <span>Updated {row.updated}</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </span>
            <span className="w-[70px] text-muted-foreground">{row.owner}</span>
            <span className="w-[70px]">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                row.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {row.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Examples — Links & References
// ============================================================================

export const LinksAndReferences = {
  name: 'Links & References',
  render: () => (
    <div className="max-w-md space-y-3 text-sm leading-relaxed">
      <p>
        Our design system is built on top of{' '}
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">
              Radix UI
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Radix UI</h4>
              <p className="text-xs text-muted-foreground">
                An open-source component library optimized for fast development, easy maintenance, and accessibility.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                radix-ui.com
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        {' '}primitives with{' '}
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">
              Tailwind CSS
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Tailwind CSS</h4>
              <p className="text-xs text-muted-foreground">
                A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                tailwindcss.com
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        {' '}styling. Documentation is powered by{' '}
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">
              Storybook
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Storybook</h4>
              <p className="text-xs text-muted-foreground">
                A frontend workshop for building UI components and pages in isolation. Used for development, testing, and documentation.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                storybook.js.org
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>.
      </p>
    </div>
  ),
};
