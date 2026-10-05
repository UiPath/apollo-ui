import { linkTo } from '@storybook/addon-links';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUpRight, Check, Clock, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib';
import { Button } from './button';

const meta = {
  title: 'Chat/Patterns',
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

type Availability = true | false | 'planned';

interface CapabilityRow {
  label: string;
  wind: Availability;
  material: Availability;
}

const CAPABILITIES: CapabilityRow[] = [
  { label: 'Message, Bubble, Attachment and Marker visuals', wind: true, material: true },
  { label: 'Auto-scroll, scroll anchoring, scroll to latest', wind: true, material: true },
  { label: 'Model and agent-mode pickers', wind: 'planned', material: true },
  { label: 'Resource manager (@ references)', wind: 'planned', material: true },
  { label: 'Streaming responses from a backend', wind: 'planned', material: true },
  { label: 'History persistence', wind: 'planned', material: true },
  {
    label: 'Embedded, FullScreen and SideBySide modes at runtime',
    wind: 'planned',
    material: true,
  },
  { label: 'Custom header actions extension point', wind: 'planned', material: true },
  { label: 'Speech to text and voice input', wind: 'planned', material: true },
  { label: 'Error and loading state injection', wind: 'planned', material: true },
  { label: 'Ships as Tailwind source you own and can restyle', wind: true, material: false },
  { label: 'Works without Material UI or Emotion in your app', wind: true, material: false },
];

const PRIMITIVE_PAGES: { name: string; title: string; story: string; role: string }[] = [
  {
    name: 'Message',
    title: 'Chat/Components/Message',
    story: 'Assistant',
    role: 'One conversation turn: avatar, header, body, footer',
  },
  {
    name: 'Bubble',
    title: 'Chat/Components/Bubble',
    story: 'Variants',
    role: 'The message surface, with variants, alignment and reactions',
  },
  {
    name: 'Attachment',
    title: 'Chat/Components/Attachment',
    story: 'Basic',
    role: 'File and image cards with upload states',
  },
  {
    name: 'Marker',
    title: 'Chat/Components/Marker',
    story: 'Default',
    role: 'System notes and separators between turns',
  },
  {
    name: 'Message Scroller',
    title: 'Chat/Components/Message Scroller',
    story: 'Basic',
    role: 'Auto-follow, turn anchoring, prepend preservation, jump to latest',
  },
];

function Cell({ value }: { value: Availability }) {
  if (value === 'planned') {
    return <Clock className="size-4 text-muted-foreground" aria-label="Planned" />;
  }
  return value ? (
    <Check className="size-4 text-success" aria-label="Yes" />
  ) : (
    <X className="size-4 text-muted-foreground/50" aria-label="No" />
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
          Autopilot Chat: Wind primitives and the service-driven ApChat
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Two things live under the Autopilot chat name in this design system today. The chat
          primitives on this page are the building blocks. The service-driven{' '}
          <InlineCode>ApChat</InlineCode> is the wired product component, and its new Wind renderer
          is being built from these primitives as <InlineCode>@uipath/apollo-react/chat</InlineCode>
          .
        </p>

        <div className="pt-6">
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">The short version</p>
            <p>
              Use the <InlineCode>apollo-wind</InlineCode> chat primitives (this Chat section) for{' '}
              <strong className="text-foreground">presentational</strong> work: mockups, design
              reviews, or a chat UI whose data layer you own. Use <InlineCode>ApChat</InlineCode>{' '}
              for a <strong className="text-foreground">fully wired</strong> product integration:
              the Autopilot chat service, streaming, history, pickers and resource references with
              almost no glue code. Today ApChat renders with Material UI; the Wind renderer lands
              behind the <InlineCode>renderer</InlineCode> setting on the same service.
            </p>
          </InfoCallout>
        </div>

        <Divider />

        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">How the pieces relate</h3>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            <InlineCode>ApChat</InlineCode> is driven by an{' '}
            <InlineCode>AutopilotChatService</InlineCode>, an event bus plus imperative API that
            owns models, agent modes, resource references, streaming, history and mode switching.
            Its UI is a rendering layer over that service. The primitives here (
            <InlineCode>Message</InlineCode>, <InlineCode>Bubble</InlineCode>,{' '}
            <InlineCode>Attachment</InlineCode>, <InlineCode>Marker</InlineCode> and{' '}
            <InlineCode>MessageScroller</InlineCode>) carry no service; the demo panel on this page
            fakes a conversation with local React state. The gaps in the table below are not
            inherent to Wind. They are the rows the Wind renderer closes as it ships.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DecisionCard
            title="Use the apollo-wind primitives"
            subtitle="Chat, Patterns (this package)"
            tone="wind"
            bullets={[
              'Building a mockup, prototype or design review artifact',
              'Building your own chat experience and you want the visual primitives only',
              'You need Tailwind-native styling you can restyle, with no MUI or Emotion dependency',
              'You do not need the Autopilot chat service, model registry or history',
            ]}
          />
          <DecisionCard
            title="Use ApChat"
            subtitle="apollo-react, ap-chat today; apollo-react/chat with the Wind renderer"
            tone="material"
            bullets={[
              'Shipping a real, connected Autopilot experience in a product',
              'You need model and agent-mode selection, resource references or streaming',
              'You need Embedded, FullScreen or SideBySide mode switching at runtime',
              'You need history, custom header actions or voice input out of the box',
            ]}
          />
        </div>

        <Divider />

        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Capability comparison</h3>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            A clock marks capabilities planned for the Wind renderer of ApChat; they are not part of
            the standalone primitives.
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left font-medium text-foreground">Capability</th>
                  <th className="w-28 p-3 text-center font-medium text-foreground">apollo-wind</th>
                  <th className="w-28 p-3 text-center font-medium text-foreground">
                    ApChat (Material)
                  </th>
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
          <p className="mb-3 text-sm leading-6 text-muted-foreground">
            The primitives the panel is built from, each on its own page with variants, states and
            behaviours:
          </p>
          <ul className="mb-6 flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle bg-card">
            {PRIMITIVE_PAGES.map((page) => (
              <li key={page.title} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{page.name}</span>
                  <span className="text-xs text-muted-foreground">{page.role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={linkTo(page.title, page.story)}>
                  Open
                  <ArrowUpRight />
                </Button>
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Embedded</strong> and{' '}
              <strong className="text-foreground">Fullscreen</strong>: the primitives assembled into
              a panel in the two placement contexts, mirroring ApChat's Embedded and FullScreen
              modes.
            </li>
            <li>
              <strong className="text-foreground">
                Apollo React, Material (Maintenance Only), Components, Chat
              </strong>
              : the service-driven <InlineCode>ApChat</InlineCode> with its full configuration
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
