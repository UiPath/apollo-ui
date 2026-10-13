import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import {
  ChatComposer,
  ChatComposerAttachButton,
  type ChatComposerDensity,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
} from './chat-composer';
import {
  ChatHero,
  type ChatHeroDensity,
  ChatHeroDescription,
  ChatHeroHeader,
  ChatHeroLogo,
  type ChatHeroProps,
  ChatHeroTitle,
} from './chat-hero';
import { type PromptSuggestionItem, PromptSuggestions } from './prompt-suggestions';

const SUGGESTIONS: PromptSuggestionItem[] = [
  { label: 'Get started', prompt: 'How do I get started with this application?' },
  { label: 'Show features', prompt: 'What features are available?' },
  { label: 'Find the highest CD rates' },
];

const meta: Meta<typeof ChatHero> = {
  title: 'Chat/Components/Chat Hero',
  component: ChatHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The first-run state of a chat, before any message. The centered layout is the home screen: greeting, composer and PromptSuggestions in a centered 800px column. The docked layout sits at the bottom of the message area, start-aligned, while the composer stays in the footer, as the Embedded chat does today. ChatHeroTitle and ChatHeroDescription render nothing for empty copy, and ChatHeroHeader hides when both are empty.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function Composer({ density }: { density?: ChatComposerDensity }) {
  return (
    <ChatComposer density={density} onSubmit={() => undefined}>
      <ChatComposerInputGroup>
        <ChatComposerTextarea placeholder="What would you like me to do?" />
        <ChatComposerToolbar>
          <ChatComposerAttachButton />
          <ChatComposerSubmit />
        </ChatComposerToolbar>
      </ChatComposerInputGroup>
    </ChatComposer>
  );
}

function CenteredDemo({ density, logo = false }: { density?: ChatHeroDensity; logo?: boolean }) {
  return (
    <div className="flex h-[640px] flex-col bg-surface p-6">
      <ChatHero layout="centered" density={density}>
        <ChatHeroHeader>
          {logo && (
            <ChatHeroLogo>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </span>
            </ChatHeroLogo>
          )}
          <ChatHeroTitle>Hello David</ChatHeroTitle>
          <ChatHeroDescription>What should we work on today?</ChatHeroDescription>
        </ChatHeroHeader>
        <Composer density={density} />
        <PromptSuggestions density={density} suggestions={SUGGESTIONS} />
      </ChatHero>
    </div>
  );
}

export const Centered: Story = {
  render: () => <CenteredDemo />,
};

export const CenteredWithLogo: Story = {
  name: 'Centered with logo',
  render: () => <CenteredDemo logo />,
};

export const CenteredCompact: Story = {
  name: 'Centered, compact',
  render: () => <CenteredDemo density="compact" />,
};

function DockedDemo({
  density,
  title = 'Welcome to Autopilot',
  description = 'Ask me anything about your data or how to use this application.',
}: {
  density?: ChatHeroDensity;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex h-[560px] w-[400px] flex-col overflow-hidden rounded-xl border border-border-subtle bg-card">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <ChatHero layout="docked" density={density}>
          <ChatHeroHeader>
            <ChatHeroTitle>{title}</ChatHeroTitle>
            <ChatHeroDescription>{description}</ChatHeroDescription>
          </ChatHeroHeader>
          <PromptSuggestions density={density} suggestions={SUGGESTIONS} />
        </ChatHero>
      </div>
      <div className="p-4 pt-2">
        <Composer density={density} />
      </div>
    </div>
  );
}

/** The composer stays in the panel footer; the hero sits at the bottom of the message area. */
export const Docked: Story = {
  parameters: { layout: 'centered' },
  render: () => <DockedDemo />,
};

export const DockedCompact: Story = {
  name: 'Docked, compact',
  parameters: { layout: 'centered' },
  render: () => <DockedDemo density="compact" />,
};

/** A host without welcome copy passes empty strings; only the suggestions show. */
export const DockedWithoutCopy: Story = {
  name: 'Docked, without copy',
  parameters: { layout: 'centered' },
  render: () => <DockedDemo title="" description="" />,
};

export const Playground: Story = {
  args: {
    layout: 'centered',
    density: 'comfortable',
  },
  render: (args: ChatHeroProps) => (
    <div className="flex h-[640px] flex-col bg-surface p-6">
      <ChatHero {...args}>
        <ChatHeroHeader>
          <ChatHeroTitle>Hello David</ChatHeroTitle>
          <ChatHeroDescription>What should we work on today?</ChatHeroDescription>
        </ChatHeroHeader>
        {args.layout !== 'docked' && <Composer density={args.density} />}
        <PromptSuggestions density={args.density} suggestions={SUGGESTIONS} />
      </ChatHero>
    </div>
  ),
};
