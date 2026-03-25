import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Experiments/Chat Experience',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visual: Story = {
  render: () => (
    <iframe
      src="http://localhost:3000"
      title="Apollo Chat"
      className="w-full border-0"
      style={{ height: '100vh' }}
    />
  ),
};

export const Setup: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="mx-auto max-w-3xl space-y-10 py-10 text-foreground">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chat Experience</h1>
        <p className="text-base text-foreground-muted">
          A fully functional AI chat built from three layers — Apollo Wind design components,
          Vercel AI Elements for conversation UX, and the Anthropic API for streaming responses.
        </p>
      </div>

      {/* Layer 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground-accent text-sm font-bold text-foreground-on-accent">1</span>
          <h2 className="text-xl font-semibold">Apollo Wind — Design</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          The visual layer. All components use <code className="rounded bg-surface-overlay px-1.5 py-0.5 text-xs">future-dark</code> tokens
          directly from the Apollo Wind design system — the same tokens used across Storybook.
        </p>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 space-y-3">
          {[
            ['ChatComposer', 'Pill-shaped input with toolbar, submit/stop button, and hover states'],
            ['PromptSuggestions', 'Clickable suggestion pills shown on the empty state'],
            ['future-dark tokens', 'Surfaces, borders, foreground, and cyan accent — shared with all Apollo components'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <code className="mt-0.5 shrink-0 rounded bg-surface-overlay px-2 py-0.5 text-xs text-foreground-accent">{name}</code>
              <span className="text-sm text-foreground-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground-accent text-sm font-bold text-foreground-on-accent">2</span>
          <h2 className="text-xl font-semibold">Vercel AI Elements — Conversation UX</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          Handles all the conversation-level rendering — streaming text, markdown, reasoning blocks, and auto-scrolling.
        </p>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 space-y-3">
          {[
            ['Conversation', 'Scrollable message container with stick-to-bottom behaviour'],
            ['Message + MessageResponse', 'Per-message layout with live markdown rendering via Streamdown'],
            ['Reasoning', 'Collapsible thinking block — auto-opens while streaming, closes on finish'],
            ['Sources', 'Collapsible list of cited URLs returned by the model'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <code className="mt-0.5 shrink-0 rounded bg-surface-overlay px-2 py-0.5 text-xs text-foreground-accent">{name}</code>
              <span className="text-sm text-foreground-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 3 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground-accent text-sm font-bold text-foreground-on-accent">3</span>
          <h2 className="text-xl font-semibold">Anthropic API — AI Backend</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          Streaming responses via the Anthropic SDK. The model is selected at runtime and passed through the transport body.
        </p>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 space-y-3">
          {[
            ['claude-sonnet-4-5', 'Default model — fast, capable, cost-efficient'],
            ['claude-opus-4-5', 'Available via model selector — highest capability'],
            ['claude-haiku-4-5', 'Available via model selector — fastest responses'],
            ['sendReasoning: true', 'Extended thinking streamed back as a collapsible block'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <code className="mt-0.5 shrink-0 rounded bg-surface-overlay px-2 py-0.5 text-xs text-foreground-accent">{name}</code>
              <span className="text-sm text-foreground-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* App location */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 space-y-2">
        <p className="text-sm font-medium text-foreground">App location</p>
        <code className="block rounded bg-surface-overlay px-3 py-2 text-xs text-foreground-muted">
          apps/apollo-chat/
        </code>
        <p className="text-xs text-foreground-subtle">
          Next.js 16 app with Turbopack. Run <code className="rounded bg-surface-overlay px-1 py-0.5">npm run dev</code> from that directory to start the preview on <code className="rounded bg-surface-overlay px-1 py-0.5">localhost:3000</code>.
        </p>
      </div>
    </div>
  ),
};
