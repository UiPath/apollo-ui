import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  ArrowLeft,
  Brain,
  ChevronDown,
  Code2,
  CornerRightUp,
  FileCode2,
  FileImage,
  Figma,
  MessageSquare,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Theme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';
import { AnimatedGradientIcon, AnimatedGradientText } from './ideas-AnimatedGradientText';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Experiments/Apollo Design',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(theme: Theme) {
  return theme ?? 'future-dark';
}

// ============================================================================
// Context option button
// ============================================================================

function ContextOption({
  icon,
  label,
  hint,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  iconClass?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-full border border-border-subtle bg-surface-raised px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-hover hover:border-border"
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          iconClass ?? 'bg-surface-overlay'
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-subtle text-xs text-foreground-subtle">
          ?
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Left sidebar
// ============================================================================

function LeftPanel() {
  return (
    <div className="flex h-full flex-col bg-surface border-r border-border-subtle">
      {/* Tabs */}
      <div className="shrink-0 border-b border-border-subtle">
        <Tabs defaultValue="chat">
          <TabsList className="h-auto w-full rounded-none bg-transparent px-3 pt-1 pb-0 gap-0">
            <TabsTrigger
              value="chat"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-foreground-muted data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-foreground-muted data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Comments
            </TabsTrigger>
            <div className="ml-auto flex items-center pb-1">
              <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TabsList>
        </Tabs>
      </div>

      {/* Context section */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-4 px-5 py-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Start with context</p>
            <p className="mt-1 text-xs text-foreground-muted">Designs grounded in real context turn out better.</p>
          </div>

          <div className="flex w-full flex-col gap-2 pt-1">
            <ContextOption
              icon={<FileCode2 className="h-4 w-4 text-[#c17a5a]" />}
              iconClass="bg-[#c17a5a]/15"
              label="Design System"
            />
            <ContextOption
              icon={<FileImage className="h-4 w-4 text-foreground-muted" />}
              label="Add screenshot"
            />
            <ContextOption
              icon={<Code2 className="h-4 w-4 text-foreground-muted" />}
              label="Attach codebase"
            />
            <ContextOption
              icon={<Figma className="h-4 w-4 text-foreground-muted" />}
              label="Drag in a Figma file"
              hint
            />
          </div>
        </div>
      </ScrollArea>

      <Separator className="bg-border-subtle" />

      {/* Chat input */}
      <div className="shrink-0 p-3">
        <div className="flex items-end gap-1.5 rounded-xl bg-surface-overlay px-3 py-2">
          <textarea
            className="flex-1 resize-none bg-transparent text-xs leading-relaxed text-foreground placeholder:text-foreground-subtle outline-none max-h-24"
            placeholder="What would you like to design?"
            rows={3}
          />
          <div className="flex shrink-0 flex-col items-center gap-1 pb-0.5">
            <div className="flex items-center gap-0.5">
              <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
                <Mic className="h-3 w-3" />
              </Button>
            </div>
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand transition-opacity hover:opacity-90"
              aria-label="Send message"
            >
              <CornerRightUp className="h-3 w-3 text-foreground-on-accent" />
            </button>
          </div>
        </div>
        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 pt-1.5 px-1">
          <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
            <Settings2 className="h-3 w-3" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 rounded-full px-2.5 text-[11px] text-foreground-muted hover:bg-surface-hover hover:text-foreground"
          >
            <Upload className="h-2.5 w-2.5" />
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Canvas toolbar
// ============================================================================

function CanvasToolbar() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-surface-overlay px-3 py-2">
      {/* Left nav */}
      <div className="flex items-center gap-0.5">
        <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
        </Button>
        <Button icon variant="ghost" size="sm" className="h-6 w-6 text-foreground-muted hover:text-foreground">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Tabs (Design Files) */}
      <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-1 py-0.5 text-xs font-medium text-foreground-muted">
        <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-foreground text-[11px]">
          <span className="h-2 w-2 rounded-sm border border-border bg-surface-raised" />
          Design Files
        </div>
      </div>

      {/* Breadcrumb */}
      <span className="text-[11px] text-foreground-subtle">project</span>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 rounded-full px-2.5 text-[11px] text-foreground-muted hover:bg-surface-hover hover:text-foreground"
        >
          <Pencil className="h-2.5 w-2.5" />
          New sketch
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 rounded-full px-2.5 text-[11px] text-foreground-muted hover:bg-surface-hover hover:text-foreground"
        >
          <MessageSquare className="h-2.5 w-2.5" />
          Paste
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Dot-grid canvas
// ============================================================================

function DesignCanvas() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      {/* Linear-gradient grid (matches Layout Generator) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-raised">
          <Brain className="h-7 w-7 text-foreground-subtle" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Creations will appear here</p>
          <p className="mt-1 text-xs text-foreground-muted max-w-[220px] leading-relaxed">
            Add context in the panel and describe what you'd like to design.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-2 rounded-full border-border-subtle bg-surface-raised px-4 text-xs text-foreground-muted hover:bg-surface-hover hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
          Start with a sketch
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Right panel
// ============================================================================

function RightPanel() {
  return (
    <div className="flex h-full flex-col bg-surface">
      <CanvasToolbar />
      <DesignCanvas />
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

function ApolloDesignPage({ globalTheme }: { globalTheme: string }) {
  const theme: Theme = (globalTheme as Theme) ?? 'future-dark';

  return (
    <div
      className={cn(resolveThemeClass(theme), 'flex h-screen w-full flex-col bg-surface text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-5">
        <div className="flex items-center gap-2.5">
          <AnimatedGradientIcon className="h-4 w-4" colorMid="#c17a5a" />
          <span className="text-sm font-semibold text-foreground">Apollo Design</span>
          <AnimatedGradientText
            colorFrom="#c17a5a"
            colorMid="#FA4616"
            colorTo="#0891b2"
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            EXPERIMENT
          </AnimatedGradientText>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-foreground-subtle">
            Design with AI context
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize="28%" minSize="22%" maxSize="40%">
            <LeftPanel />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="72%">
            <RightPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Default: Story = {
  name: 'Apollo Design',
  render: (_, { globals }) => <ApolloDesignPage globalTheme={globals.theme || 'future-dark'} />,
};
