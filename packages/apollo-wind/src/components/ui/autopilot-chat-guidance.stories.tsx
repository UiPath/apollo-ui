import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib';

const meta = {
  title: 'Patterns/Autopilot Chat',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

interface CapabilityRow {
  label: string;
  wind: boolean | string;
  material: boolean | string;
}

const CAPABILITIES: CapabilityRow[] = [
  { label: 'Message/Bubble/Attachment/Marker visuals', wind: true, material: true },
  { label: 'Auto-scroll, scroll anchoring, scroll-to-latest', wind: true, material: true },
  { label: 'Real model/agent-mode registry', wind: false, material: true },
  { label: 'Resource manager (@ references)', wind: false, material: true },
  { label: 'Streaming responses from a backend', wind: false, material: true },
  { label: 'History persistence', wind: false, material: true },
  {
    label: 'SideBySide / FullScreen / Embedded mode switching at runtime',
    wind: false,
    material: true,
  },
  { label: 'Custom header actions extension point', wind: false, material: true },
  { label: 'STT / voice input', wind: false, material: true },
  { label: 'Error/loading state injection', wind: false, material: true },
  { label: 'Ships as Tailwind source you own and can restyle freely', wind: true, material: false },
  { label: 'Works without Material UI / Emotion in your app', wind: true, material: false },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-muted-foreground">{value}</span>;
  }
  return value ? (
    <Check className="size-4 text-success" />
  ) : (
    <X className="size-4 text-muted-foreground/50" />
  );
}

function DecisionCard({
  title,
  subtitle,
  bullets,
  tone,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  tone: 'wind' | 'material';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-5',
        tone === 'wind' ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
      </div>
      <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="text-foreground">-</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WindVsMaterialPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">
          Autopilot Chat: Wind vs. Material
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Two different things live under the "Autopilot chat" name in this design system. They are
          not alternatives to pick by preference. They solve different problems.
        </p>

        <div className="pt-6">
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">The short version</p>
            <p>
              Use <InlineCode>apollo-wind</InlineCode>'s chat primitives (this Patterns page) for{' '}
              <strong className="text-foreground">presentational</strong> work: mockups, design
              reviews, or a custom chat UI you're wiring up yourself. Use{' '}
              <InlineCode>apollo-react</InlineCode>'s <InlineCode>ApChat</InlineCode> (Material) for{' '}
              <strong className="text-foreground">fully wired</strong> product integration: a real,
              connected Autopilot experience with almost no glue code.
            </p>
          </InfoCallout>
        </div>

        <Divider />

        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Why two implementations</h3>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            <InlineCode>ApChat</InlineCode> is driven by an{' '}
            <InlineCode>AutopilotChatService</InlineCode>, an event-bus + imperative API that owns
            models, agent modes, resource references, streaming, history, and mode switching. The
            chat UI is a thin rendering layer over that service. The{' '}
            <InlineCode>apollo-wind</InlineCode> version doesn't have that service; it's{' '}
            <InlineCode>Message</InlineCode>, <InlineCode>Bubble</InlineCode>,{' '}
            <InlineCode>Attachment</InlineCode>, <InlineCode>Marker</InlineCode>, and{' '}
            <InlineCode>MessageScroller</InlineCode> as Tailwind primitives, assembled into a demo
            panel that fakes a conversation with local React state. Neither is "the old one". They
            target different jobs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DecisionCard
            title="Use apollo-wind"
            subtitle="Patterns → Autopilot Chat (this package)"
            tone="wind"
            bullets={[
              'Building a mockup, prototype, or design review artifact',
              "You're building your own chat experience and just want the visual primitives",
              'You need Tailwind-native styling you can freely restyle, with no MUI/Emotion dependency',
              "You don't need a real backend connection, model registry, or history",
            ]}
          />
          <DecisionCard
            title="Use Material ApChat"
            subtitle="apollo-react → Components → Chat"
            tone="material"
            bullets={[
              'Shipping a real, connected Autopilot experience in a product',
              'You need model/agent-mode selection, resource references, or streaming',
              'You need SideBySide/FullScreen/Embedded mode switching at runtime',
              'You need history, custom header actions, or voice input out of the box',
            ]}
          />
        </div>

        <Divider />

        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Capability comparison</h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left font-medium text-foreground">Capability</th>
                  <th className="w-28 p-3 text-center font-medium text-foreground">apollo-wind</th>
                  <th className="w-28 p-3 text-center font-medium text-foreground">Material</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((row, i) => (
                  <tr
                    key={row.label}
                    className={cn(
                      i % 2 === 1 && 'bg-muted/20',
                      'border-b border-border last:border-0'
                    )}
                  >
                    <td className="p-3 text-muted-foreground">{row.label}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Cell value={row.wind} />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Cell value={row.material} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Divider />

        <div>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Where to look</h3>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Components</strong>: the apollo-wind primitives
              (Message/Bubble, Attachment, Marker, MessageScroller) shown in isolation.
            </li>
            <li>
              <strong className="text-foreground">Layout Embedded</strong> /{' '}
              <strong className="text-foreground">Layout Fullscreen</strong>: the apollo-wind panel
              assembled into the two placement contexts, mirroring <InlineCode>ApChat</InlineCode>'s
              Embedded/FullScreen modes.
            </li>
            <li>
              <strong className="text-foreground">
                Apollo React → Material (Maintenance Only) → Components → Chat
              </strong>
              : the real, service-driven <InlineCode>ApChat</InlineCode>, with a full configuration
              harness (models, agent modes, resource manager, streaming, feature toggles).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const WindVsMaterial: Story = {
  name: 'Wind vs Material',
  render: () => <WindVsMaterialPage />,
};
