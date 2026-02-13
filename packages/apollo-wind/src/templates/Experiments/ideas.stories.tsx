import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import './ideas-experiments.css';
import {
  AnimatedGradientIcon,
  AnimatedGradientText,
} from './ideas-AnimatedGradientText';
import {
  AlertCircle,
  ChevronLeft,
  Clipboard,
  ClipboardCheck,
  CornerRightUp,
  GripVertical,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  MessageSquare,
  Minus,
  RotateCcw,
  Settings,
  Trash2,
  User,
  Workflow,
  X,
} from 'lucide-react';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';
import type { FutureTheme } from '@/foundation/Future/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Template components — available to the LLM via liveScope
import { MaestroTemplate, Canvas, Grid, GridItem } from '../Maestro/template-maestro';
import { Panel } from '@/components/custom/panel-maestro';
import { FlowTemplate } from '../Flow/template-flow';
import { DelegateTemplate } from '../Delegate/template-delegate';
import {
  AdminTemplate,
  AdminSidebar,
  AdminSidebarHeader,
  AdminSidebarNav,
  AdminPageHeader,
  AdminToolbar,
} from '../Admin/template-admin';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Experiments/Ideas',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// react-live scope — components the LLM can use in generated JSX
// ============================================================================

const baseLiveScope = {
  React,
  cn,
  // UI components
  Button,
  Badge,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Input,
  Label,
  Separator,
  ScrollArea,
  Avatar, AvatarFallback, AvatarImage,
  Progress,
  Switch,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  // Templates & layout primitives
  MaestroTemplate, Canvas, Grid, GridItem, Panel,
  FlowTemplate,
  DelegateTemplate,
  AdminTemplate, AdminSidebar, AdminSidebarHeader, AdminSidebarNav, AdminPageHeader, AdminToolbar,
};

// ============================================================================
// Anthropic API
// ============================================================================

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_API_URL =
  import.meta.env.VITE_ANTHROPIC_API_URL ?? 'https://api.anthropic.com/v1/messages';

type TemplateChoice = 'maestro' | 'admin' | 'flow' | 'delegate' | 'freeform';

function getTemplateInstruction(template: TemplateChoice): string {
  switch (template) {
    case 'maestro':
      return `The user selected the MAESTRO template. You MUST wrap the entire output in:
<MaestroTemplate theme={currentTheme} title="Maestro">
  ...content here...
</MaestroTemplate>

MaestroTemplate props: theme, title, tenantName, defaultLeftPanelCollapsed, leftPanelContent (ReactNode), defaultRightPanelCollapsed, rightPanelContent (ReactNode), children (main canvas).
Sub-components available: Canvas (scrollable main area), Grid + GridItem (responsive grid), Panel (collapsible side panel).
Use Grid with GridItem children for dashboard-style card layouts. GridItem accepts colSpan and rowSpan for sizing.
leftPanelContent and rightPanelContent render inside collapsible panels.`;

    case 'admin':
      return `The user selected the ADMIN template. You MUST wrap the entire output in:
<AdminTemplate theme={currentTheme} title="Administration">
  ...content here...
</AdminTemplate>

AdminTemplate props: theme, title, menuContent (ReactNode for header drawer), sidebar (ReactNode), children (main area).
Sub-components available:
- AdminSidebar (width prop, contains sidebar content)
- AdminSidebarHeader (title, icon, actions props)
- AdminSidebarNav (items array of {id, label, icon?, badge?}, selectedId, onSelect)
- AdminPageHeader (title, breadcrumb as string[], actions, tabs array of {value,label}, activeTab, onTabChange)
- AdminToolbar (children for left filters, actions for right side)
Pass sidebar={<AdminSidebar width={280}>...</AdminSidebar>} to AdminTemplate for a sidebar layout.
Children of AdminTemplate become the main content: use AdminPageHeader, AdminToolbar, then your table/content.`;

    case 'flow':
      return `The user selected the FLOW template. You MUST wrap the entire output in:
<FlowTemplate theme={currentTheme}>
  ...content here...
</FlowTemplate>

FlowTemplate props: theme, defaultPanelOpen (boolean), flowName, flowType, children (canvas content).
This is a flow/workflow editor layout with a left chat panel, canvas area, and properties bar.
The children render in the main canvas area. Use it for workflow visualizations, node editors, and process diagrams.`;

    case 'delegate':
      return `The user selected the DELEGATE template. You MUST wrap the entire output in:
<DelegateTemplate theme={currentTheme}>
  ...content here...
</DelegateTemplate>

DelegateTemplate props: theme, defaultPanelOpen (boolean), navItems (array of nav sections), selectedChildId, onChildSelect, children (canvas content).
This is a delegate/agent layout with a collapsible navigation panel on the left and a main canvas.
Use it for chat interfaces, agent dashboards, and tool card layouts.`;

    case 'freeform':
      return `The user selected FREEFORM mode — no template wrapper.
Generate raw JSX layout using the available UI components and Tailwind classes.
Wrap in a single <div> with appropriate sizing (e.g. className="p-6 space-y-6").
This is useful for standalone components, cards, forms, or experimental layouts.`;
  }
}

function buildSystemPrompt(persona: string, template: TemplateChoice) {
  const componentList = Object.keys(baseLiveScope)
    .filter((k) => k !== 'React' && k !== 'cn')
    .join(', ');

  const templateInstruction = getTemplateInstruction(template);

  return `You are an expert UI developer. The user will describe a layout or page idea.
You MUST respond with ONLY valid JSX code — no markdown fences, no explanation, no imports.
The code will be rendered directly by react-live, so it must be a single JSX expression
(wrap in a fragment <></> or a <div> if needed).

Available components (already in scope — do NOT import):
${componentList}

Also available:
- cn() utility for conditional classNames
- currentTheme — a string variable holding the active theme name (e.g. "dark", "light"). Pass it as theme={currentTheme} to template components.
- All standard HTML elements

TEMPLATE LAYOUT:
${templateInstruction}

STYLING — Follow these rules exactly.

The environment uses CSS custom properties. Both "future-*" semantic tokens and shadcn bridge tokens resolve correctly.

Component usage patterns:
- Card: <Card className="bg-card text-card-foreground"> with CardHeader (CardTitle, CardDescription), CardContent, CardFooter
- Table: <Table> with <TableHeader> rows using <TableHead className="text-muted-foreground"> and <TableBody> cells using <TableCell className="text-foreground">
- Badge: <Badge> (default), <Badge variant="outline">, <Badge variant="secondary">, <Badge variant="destructive">
- Button: <Button> (default), <Button variant="outline">, <Button variant="ghost">, <Button variant="secondary">, <Button variant="destructive">
- Input: <Input placeholder="..." /> (styled by default)
- Progress: <Progress value={n} />
- Avatar: <Avatar><AvatarImage src="..." /><AvatarFallback>AB</AvatarFallback></Avatar>
- ScrollArea: <ScrollArea className="h-[300px]">...content...</ScrollArea>
- Separator: <Separator /> for visual dividers

Bridge tokens (preferred for content inside templates — cross-theme safe):
- Surfaces: bg-background, bg-card, bg-muted, bg-muted/50, bg-primary, bg-primary/10
- Text: text-foreground, text-muted-foreground, text-card-foreground, text-primary, text-primary-foreground
- Borders: border-border, border-input

Future-specific tokens (also available):
- Surfaces: bg-future-surface, bg-future-surface-raised, bg-future-surface-overlay, bg-future-surface-hover
- Text: text-future-foreground, text-future-foreground-muted, text-future-foreground-subtle, text-future-foreground-accent
- Borders: border-future-border, border-future-border-subtle
- Accent: bg-future-accent, bg-future-accent-subtle

Common layout patterns:
- Section header: <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-foreground">Title</h2><p className="text-sm text-muted-foreground">Description</p></div><Button>Action</Button></div>
- Card grid: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
- Stat card: <Card className="bg-card"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Label</p><span className="text-2xl font-bold text-foreground">1,234</span><p className="text-xs text-primary">+12%</p></CardContent></Card>
- Stats row: <div className="grid grid-cols-4 gap-4">{stat cards}</div>

The user's role is "${persona}" — tailor content and terminology to that persona.

Rules:
- Return ONLY the JSX. No prose, no markdown, no code fences.
- Use className, not class.
- Do not use hooks (useState, useEffect, etc.) — the JSX is a static render expression.
- Make the layout visually polished, using spacing, rounded corners, and the component library.
- Fill in realistic sample data (names, numbers, labels) rather than placeholder text.
- The output renders inside a container that is the full viewport height. Templates already handle h-screen, so do NOT add h-screen to your outermost element.
- Always use the shadcn components (Card, Table, Button, Badge, etc.) instead of raw HTML when available.
- Do NOT use raw hex colors or Tailwind palette (bg-zinc-900, text-gray-400). Always use semantic tokens.
- Do NOT use bg-black or bg-white — use bg-background, bg-card, or bg-future-surface instead.`;
}

async function callClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  // Strip markdown fences if the model wraps them anyway
  return text
    .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(theme: FutureTheme) {
  if (theme === 'legacy-dark') return 'legacy-dark';
  if (theme === 'legacy-light') return 'legacy-light';
  if (theme === 'wireframe') return 'future-wireframe';
  if (theme === 'vertex') return 'future-vertex';
  if (theme === 'canvas') return 'future-canvas';
  if (theme === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Floating Chat Widget
// ============================================================================

const PERSONAS = [
  'Designer',
  'Product Manager',
  'Engineer',
  'Data Scientist',
  'Sales',
  'Executive',
] as const;
type Persona = (typeof PERSONAS)[number];

const TEMPLATE_SUGGESTIONS: Record<TemplateChoice, string[]> = {
  maestro: [
    'Analytics dashboard with revenue and user charts',
    'Overview page with KPI cards and recent activity',
    'Monitoring dashboard with status panels',
  ],
  admin: [
    'User management page with roles table',
    'Settings page with sidebar navigation',
    'Data management view with filters and pagination',
  ],
  flow: [
    'Workflow list with 20 automation workflows',
    'Process overview with status indicators',
    'Pipeline editor canvas with connected nodes',
  ],
  delegate: [
    'Agent chat with tool cards and suggestions',
    'Conversation view with message history',
    'Assistant dashboard with active sessions',
  ],
  freeform: [
    'Pricing cards with feature comparison',
    'User profile with stats and activity feed',
    'Notification center with grouped alerts',
  ],
};

const TEMPLATE_OPTIONS: { value: TemplateChoice; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'maestro', label: 'Maestro', description: 'Dashboard with panels & grid', icon: <LayoutDashboard className="h-4 w-4" /> },
  { value: 'admin', label: 'Admin', description: 'Sidebar, header & data tables', icon: <Settings className="h-4 w-4" /> },
  { value: 'flow', label: 'Flow', description: 'Workflow editor with canvas', icon: <Workflow className="h-4 w-4" /> },
  { value: 'delegate', label: 'Delegate', description: 'Agent chat with nav panel', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'freeform', label: 'Freeform', description: 'No template — raw components', icon: <Lightbulb className="h-4 w-4" /> },
];

interface FloatingChatProps {
  globalTheme: FutureTheme;
  onCodeGenerated: (code: string) => void;
  onGeneratingChange: (generating: boolean) => void;
  isGenerating: boolean;
  onClearCanvas: () => void;
}

function FloatingChat({
  globalTheme,
  onCodeGenerated,
  onGeneratingChange,
  isGenerating,
  onClearCanvas,
}: FloatingChatProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [hasCustomPosition, setHasCustomPosition] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dragRef = React.useRef<HTMLDivElement>(null);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [persona, setPersona] = React.useState<Persona | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateChoice | null>(null);

  const isSetupComplete = persona !== null && selectedTemplate !== null;
  const setupStep: 'persona' | 'template' = persona === null ? 'persona' : 'template';

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----- Drag logic -----
  const handleDragPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    setPosition({
      x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, maxX)),
      y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, maxY)),
    });
    setHasCustomPosition(true);
  };

  const handleDragPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // ----- Full reset -----
  const handleReset = () => {
    setMessages([]);
    setInputValue('');
    setPersona(null);
    setSelectedTemplate(null);
    setError(null);
    onClearCanvas();
  };

  // ----- Chat submit — calls Claude -----
  const handleSubmit = async () => {
    if (!inputValue.trim() || !isSetupComplete || isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setError(null);

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-api-key-here') {
      setError('Add your Anthropic API key to packages/apollo-wind/.env');
      return;
    }

    onGeneratingChange(true);

    try {
      const systemPrompt = buildSystemPrompt(persona, selectedTemplate);

      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const code = await callClaude(apiMessages, systemPrompt);

      onCodeGenerated(code);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Layout generated on canvas. You can describe changes to iterate.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error generating layout. ${msg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      onGeneratingChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ----- Positioning -----
  const positionStyle: React.CSSProperties = hasCustomPosition
    ? { position: 'fixed', left: position.x, top: position.y }
    : { position: 'fixed', right: 24, bottom: 24 };

  // ----- Collapsed state -----
  if (isCollapsed) {
    return (
      <div
        ref={dragRef}
        data-drag-handle
        className="z-50 select-none"
        style={{ ...positionStyle, cursor: isDragging ? 'grabbing' : 'default' }}
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
      >
        <div className="flex items-center gap-2 rounded-full border border-future-border bg-future-surface-raised px-3 py-2.5 shadow-lg transition-all hover:bg-future-surface-hover">
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-future-foreground-subtle active:cursor-grabbing" />
          <button onClick={() => setIsCollapsed(false)} className="flex items-center gap-2">
            <AnimatedGradientIcon className="h-4 w-4" />
            <span className="text-sm font-medium text-future-foreground">Ideas</span>
            {messages.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-future-accent px-1 text-[10px] font-bold text-future-foreground-on-accent">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ----- Expanded state -----
  return (
    <div
      ref={dragRef}
      className={cn(
        'z-50 flex w-[320px] flex-col overflow-hidden rounded-2xl border border-future-border bg-future-surface-raised shadow-2xl select-none',
        isDragging ? 'ring-2 ring-future-accent/30' : ''
      )}
      style={{ ...positionStyle, height: 480 }}
    >
      {/* Title bar — drag handle */}
      <div
        data-drag-handle
        className="flex h-11 shrink-0 cursor-grab items-center justify-between border-b border-future-border-subtle bg-future-surface-overlay px-3 active:cursor-grabbing"
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-future-foreground-subtle" />
          <AnimatedGradientIcon className="h-3.5 w-3.5" />
          <span className="text-sm font-medium text-future-foreground">Ideas Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          {(isSetupComplete || messages.length > 0) && (
            <button
              onClick={handleReset}
              className="flex h-6 w-6 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
              aria-label="Reset"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
            aria-label="Collapse chat"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Context bar */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-future-border-subtle bg-future-surface-overlay/50 px-3">
        {!isSetupComplete && setupStep === 'template' && (
          <button
            onClick={() => setPersona(null)}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] text-future-foreground-subtle transition-colors hover:bg-future-surface-hover hover:text-future-foreground-muted"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>
        )}
        {!isSetupComplete && setupStep === 'persona' && (
          <span className="text-[10px] text-future-foreground-subtle">Step 1 of 2</span>
        )}
        {!isSetupComplete && setupStep === 'template' && (
          <>
            <span className="text-future-foreground-subtle">·</span>
            <span className="text-[10px] text-future-foreground-subtle">Step 2 of 2</span>
          </>
        )}
        {persona && (
          <button
            onClick={() => setPersona(null)}
            className="flex items-center gap-1 rounded-md bg-future-accent/10 px-2 py-0.5 text-[10px] font-medium text-future-foreground-accent transition-colors hover:bg-future-accent/20"
          >
            <User className="h-2.5 w-2.5" />
            {persona}
          </button>
        )}
        {persona && selectedTemplate && (
          <>
            <span className="text-future-foreground-subtle">·</span>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1 rounded-md bg-future-accent/10 px-2 py-0.5 text-[10px] font-medium text-future-foreground-accent transition-colors hover:bg-future-accent/20"
            >
              {TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.icon}
              {TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.label}
            </button>
          </>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!isSetupComplete ? (
          <div className="flex h-full flex-col">
            {setupStep === 'persona' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
                  <User className="h-5 w-5 text-future-foreground-accent" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-medium text-future-foreground">I am a...</p>
                  <p className="mt-1 text-[11px] leading-4 text-future-foreground-muted">
                    Select your role to personalize the output.
                  </p>
                </div>
                <div className="mt-1 grid w-full grid-cols-2 gap-1.5">
                  {PERSONAS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className="rounded-lg border border-future-border-subtle px-3 py-1.5 text-[12px] font-normal text-future-foreground-muted transition-colors hover:border-future-accent hover:bg-future-accent/10 hover:text-future-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
                  <LayoutDashboard className="h-5 w-5 text-future-foreground-accent" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-medium text-future-foreground">Use template...</p>
                  <p className="mt-1 text-[11px] leading-4 text-future-foreground-muted">
                    Pick a base layout for the generated output.
                  </p>
                </div>
                <div className="mt-1 flex w-full flex-col gap-1.5">
                  {TEMPLATE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedTemplate(t.value)}
                      className="flex items-center gap-2.5 rounded-lg border border-future-border-subtle px-3 py-2 text-left transition-colors hover:border-future-accent hover:bg-future-accent/10"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-future-surface-overlay text-future-foreground-muted">
                        {t.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-future-foreground">{t.label}</p>
                        <p className="text-[10px] leading-tight text-future-foreground-subtle">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
              <Lightbulb className="h-5 w-5 text-future-foreground-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-future-foreground">
                What would you like to build?
              </p>
              <p className="mt-1 text-[11px] leading-4 text-future-foreground-muted">
                Describe a layout and I'll generate it on the canvas.
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-1.5">
              {(TEMPLATE_SUGGESTIONS[selectedTemplate ?? 'freeform'] ?? []).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="w-full rounded-lg border border-future-border-subtle px-3 py-2 text-left text-[11px] text-future-foreground-muted transition-colors hover:border-future-border hover:bg-future-surface-hover hover:text-future-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'ml-auto bg-future-accent text-future-foreground-on-accent'
                    : 'mr-auto bg-future-surface-overlay text-future-foreground'
                )}
              >
                {msg.content}
              </div>
            ))}
            {isGenerating && (
              <div className="mr-auto flex items-center gap-2 rounded-xl bg-future-surface-overlay px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-future-accent" />
                <span className="text-xs text-future-foreground-muted">Generating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 border-t border-red-500/20 bg-red-500/10 px-3 py-2">
          <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />
          <span className="text-[10px] leading-tight text-red-400">{error}</span>
        </div>
      )}

      {/* Input area */}
      <div className={cn(
        'shrink-0 border-t border-future-border-subtle p-2',
        (!isSetupComplete || isGenerating) && 'pointer-events-none opacity-40'
      )}>
        <div className="flex items-end gap-1.5 rounded-xl bg-future-surface-overlay px-3 py-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSetupComplete ? 'Describe your idea...' : 'Complete setup above...'}
            rows={1}
            disabled={!isSetupComplete || isGenerating}
            className="max-h-16 flex-1 resize-none bg-transparent text-xs leading-relaxed text-future-foreground placeholder:text-future-foreground-subtle focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || !isSetupComplete || isGenerating}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-future-accent transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Send message"
          >
            <CornerRightUp className="h-3 w-3 text-future-foreground-on-accent" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Ideas Canvas
// ============================================================================

interface IdeasCanvasProps {
  theme: FutureTheme;
  generatedCode: string;
  isGenerating: boolean;
}

function IdeasCanvas({ theme, generatedCode, isGenerating }: IdeasCanvasProps) {
  const themeClass = resolveThemeClass(theme);

  const liveScope = React.useMemo(
    () => ({ ...baseLiveScope, currentTheme: theme }),
    [theme]
  );

  // Empty state
  if (!generatedCode && !isGenerating) {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-future-border-subtle bg-future-surface-raised">
            <Lightbulb className="h-8 w-8 text-future-foreground-subtle" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-future-foreground">Your canvas is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-future-foreground-muted">
              Use the chat assistant in the bottom right to describe what you'd like to build. Your
              generated layouts will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isGenerating && !generatedCode) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-future-accent" />
          <p className="text-sm text-future-foreground-muted">Generating layout...</p>
        </div>
      </div>
    );
  }

  // Live preview
  return (
    <div className="relative h-full w-full overflow-auto">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className={cn(themeClass, 'relative h-full')} style={{ fontFamily: fontFamily.base }}>
        <LiveProvider code={generatedCode} scope={liveScope} noInline={false}>
          <LivePreview className="h-full" />
          <LiveError className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-400" />
        </LiveProvider>
      </div>
    </div>
  );
}

// ============================================================================
// Ideas Page
// ============================================================================

function IdeasPage({ globalTheme }: { globalTheme: string }) {
  const theme: FutureTheme =
    globalTheme === 'legacy-dark'
      ? 'legacy-dark'
      : globalTheme === 'legacy-light'
        ? 'legacy-light'
        : globalTheme === 'wireframe'
          ? 'wireframe'
          : globalTheme === 'vertex'
            ? 'vertex'
            : globalTheme === 'canvas'
              ? 'canvas'
              : globalTheme === 'light'
                ? 'light'
                : 'dark';

  const [generatedCode, setGeneratedCode] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setGeneratedCode('');
  };

  return (
    <div
      className={cn(
        resolveThemeClass(theme),
        'flex h-screen w-full flex-col bg-future-surface text-foreground'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-future-border-subtle px-5">
        <div className="flex items-center gap-2.5">
          <AnimatedGradientIcon className="h-4 w-4" />
          <span className="text-sm font-semibold text-future-foreground">Ideas</span>
          <AnimatedGradientText
            colorMid="#FA4616"
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            EXPERIMENT
          </AnimatedGradientText>
        </div>
        <div className="flex items-center gap-2">
          {generatedCode ? (
            <>
              <button
                onClick={handleCopy}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-future-border px-2.5 text-[11px] font-medium text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground"
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3 w-3" />
                    Copy JSX
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-future-border px-2.5 text-[11px] font-medium text-future-foreground-muted transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </>
          ) : (
            <span className="text-[11px] text-future-foreground-subtle">
              Describe an idea — see it come to life
            </span>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden">
        <IdeasCanvas
          theme={theme}
          generatedCode={generatedCode}
          isGenerating={isGenerating}
        />
      </div>

      {/* Floating chat widget */}
      <FloatingChat
        globalTheme={theme}
        onCodeGenerated={setGeneratedCode}
        onGeneratingChange={setIsGenerating}
        isGenerating={isGenerating}
        onClearCanvas={handleClear}
      />
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Default: Story = {
  name: 'Ideas',
  render: (_, { globals }) => (
    <IdeasPage globalTheme={globals.futureTheme || 'dark'} />
  ),
};
