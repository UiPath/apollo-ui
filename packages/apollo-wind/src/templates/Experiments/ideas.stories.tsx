import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import './ideas-experiments.css';
import {
  AnimatedGradientIcon,
  AnimatedGradientText,
} from './ideas-AnimatedGradientText';
import {
  CornerRightUp,
  MessageSquare,
  Minus,
  GripVertical,
  Lightbulb,
  X,
  User,
  Palette,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';
import type { FutureTheme } from '@/foundation/Future/types';

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
// Helpers
// ============================================================================

function resolveThemeClass(theme: FutureTheme) {
  if (theme === 'legacy-dark') return 'legacy-dark';
  if (theme === 'legacy-light') return 'legacy-light';
  if (theme === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Floating Chat Widget
// ============================================================================

// ---- Persona & theme options ----

const PERSONAS = [
  'Designer',
  'Product Manager',
  'Engineer',
  'Data Scientist',
  'Sales',
  'Executive',
] as const;
type Persona = (typeof PERSONAS)[number];

const THEME_OPTIONS: { label: string; value: FutureTheme }[] = [
  { label: 'Future Dark', value: 'dark' },
  { label: 'Future Light', value: 'light' },
  { label: 'Legacy Dark', value: 'legacy-dark' },
  { label: 'Legacy Light', value: 'legacy-light' },
];

function FloatingChat() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [hasCustomPosition, setHasCustomPosition] = React.useState(false);
  const dragRef = React.useRef<HTMLDivElement>(null);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Setup state
  const [persona, setPersona] = React.useState<Persona | null>(null);
  const [selectedTheme, setSelectedTheme] = React.useState<FutureTheme | null>(null);

  const isSetupComplete = persona !== null && selectedTheme !== null;

  // Which setup step is active (only relevant when setup is incomplete)
  const setupStep: 'persona' | 'theme' =
    persona === null ? 'persona' : 'theme';

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----- Drag logic (scoped to the drag-handle element) -----
  const handleDragPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    setIsDragging(true);

    const el = dragRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
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
    setSelectedTheme(null);
  };

  // ----- Chat submit -----
  const handleSubmit = () => {
    if (!inputValue.trim() || !isSetupComplete) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulated assistant response
    setTimeout(() => {
      const themeLabel =
        THEME_OPTIONS.find((t) => t.value === selectedTheme)?.label ?? selectedTheme;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'll create that for you as a ${persona} using the ${themeLabel} theme. Generating layout...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ----- Positioning -----
  const positionStyle: React.CSSProperties = hasCustomPosition
    ? {
        position: 'fixed',
        left: position.x,
        top: position.y,
      }
    : {
        position: 'fixed',
        right: 24,
        bottom: 24,
      };

  // ----- Collapsed state: small pill -----
  if (isCollapsed) {
    return (
      <div
        ref={dragRef}
        data-drag-handle
        className="z-50 select-none"
        style={{
          ...positionStyle,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
      >
        <div className="flex items-center gap-2 rounded-full border border-future-border bg-future-surface-raised px-3 py-2.5 shadow-lg transition-all hover:bg-future-surface-hover">
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-future-foreground-subtle active:cursor-grabbing" />
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2"
          >
            <AnimatedGradientIcon className="h-4 w-4" />
            <span className="text-sm font-medium text-future-foreground">
              Ideas
            </span>
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
      style={{
        ...positionStyle,
        height: 400,
      }}
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
          <span className="text-xs font-semibold text-future-foreground">
            Ideas Assistant
          </span>
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

      {/* Context bar — always visible */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-future-border-subtle bg-future-surface-overlay/50 px-3">
        {/* Back button — show on theme step */}
        {!isSetupComplete && setupStep === 'theme' && (
          <button
            onClick={() => setPersona(null)}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] text-future-foreground-subtle transition-colors hover:bg-future-surface-hover hover:text-future-foreground-muted"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>
        )}

        {/* Step indicator — show during setup when no back button */}
        {!isSetupComplete && setupStep === 'persona' && (
          <span className="text-[10px] text-future-foreground-subtle">
            Step 1 of 2
          </span>
        )}
        {!isSetupComplete && setupStep === 'theme' && (
          <>
            <span className="text-future-foreground-subtle">·</span>
            <span className="text-[10px] text-future-foreground-subtle">
              Step 2 of 2
            </span>
          </>
        )}

        {/* Selection pills — show after setup */}
        {persona && (
          <button
            onClick={() => setPersona(null)}
            className="flex items-center gap-1 rounded-md bg-future-accent/10 px-2 py-0.5 text-[10px] font-medium text-future-accent-foreground transition-colors hover:bg-future-accent/20"
          >
            <User className="h-2.5 w-2.5" />
            {persona}
          </button>
        )}
        {persona && selectedTheme && (
          <>
            <span className="text-future-foreground-subtle">·</span>
            <button
              onClick={() => setSelectedTheme(null)}
              className="flex items-center gap-1 rounded-md bg-future-accent/10 px-2 py-0.5 text-[10px] font-medium text-future-accent-foreground transition-colors hover:bg-future-accent/20"
            >
              <Palette className="h-2.5 w-2.5" />
              {THEME_OPTIONS.find((t) => t.value === selectedTheme)?.label}
            </button>
          </>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!isSetupComplete ? (
          /* ---- Setup wizard ---- */
          <div className="flex h-full flex-col">
            {setupStep === 'persona' ? (
              /* Step 1: Persona */
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
                  <User className="h-5 w-5 text-future-accent-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-medium text-future-foreground">
                    I am a...
                  </p>
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
              /* Step 2: Theme */
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
                  <Palette className="h-5 w-5 text-future-accent-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-medium text-future-foreground">
                    Generate in...
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-future-foreground-muted">
                    Choose a theme for the generated layout.
                  </p>
                </div>
                <div className="mt-1 flex w-full flex-col gap-1.5">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedTheme(t.value)}
                      className="flex items-center gap-2 rounded-lg border border-future-border-subtle px-3 py-1.5 text-[12px] font-normal text-future-foreground-muted transition-colors hover:border-future-accent hover:bg-future-accent/10 hover:text-future-foreground"
                    >
                      <span
                        className={cn(
                          'h-3 w-3 rounded-full border',
                          t.value === 'dark'
                            ? 'border-future-border bg-[#0a0a0a]'
                            : t.value === 'light'
                              ? 'border-future-border bg-[#f5f5f5]'
                              : t.value === 'legacy-dark'
                                ? 'border-future-border bg-[#1a1a2e]'
                                : 'border-future-border bg-[#e8e8e8]'
                        )}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          /* ---- Ready state: suggestions ---- */
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent/10">
              <Lightbulb className="h-5 w-5 text-future-accent-foreground" />
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
              {[
                'Maestro dashboard for analytics',
                'Flow layout with 20 workflows',
                'Delegate chat with tool cards',
              ].map((suggestion) => (
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
          /* ---- Chat messages ---- */
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area — disabled until setup is complete */}
      <div className={cn(
        'shrink-0 border-t border-future-border-subtle p-2',
        !isSetupComplete && 'pointer-events-none opacity-40'
      )}>
        <div className="flex items-end gap-1.5 rounded-xl bg-future-surface-overlay px-3 py-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSetupComplete ? 'Describe your idea...' : 'Complete setup above...'}
            rows={1}
            disabled={!isSetupComplete}
            className="max-h-16 flex-1 resize-none bg-transparent text-xs leading-relaxed text-future-foreground placeholder:text-future-foreground-subtle focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || !isSetupComplete}
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

function IdeasCanvas({ theme }: { theme: FutureTheme }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Center empty state */}
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-future-border-subtle bg-future-surface-raised">
          <Lightbulb className="h-8 w-8 text-future-foreground-subtle" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-future-foreground">
            Your canvas is empty
          </h2>
          <p className="mt-1 max-w-sm text-sm text-future-foreground-muted">
            Use the chat assistant in the bottom right to describe what you'd
            like to build. Your generated layouts will appear here.
          </p>
        </div>
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
        : globalTheme === 'light'
          ? 'light'
          : 'dark';

  return (
    <div
      className={cn(
        resolveThemeClass(theme),
        'flex h-screen w-full flex-col bg-future-surface text-foreground'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      {/* Minimal top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-future-border-subtle px-5">
        <div className="flex items-center gap-2.5">
          <AnimatedGradientIcon className="h-4 w-4" />
          <span className="text-sm font-semibold text-future-foreground">
            Ideas
          </span>
          <AnimatedGradientText
            colorMid="#FA4616"
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            EXPERIMENT
          </AnimatedGradientText>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-future-foreground-subtle">
            Describe an idea — see it come to life
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden">
        <IdeasCanvas theme={theme} />
      </div>

      {/* Floating chat widget */}
      <FloatingChat />
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
