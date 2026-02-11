import type { Meta, StoryObj } from '@storybook/react-vite';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_, { globals }) => (
    <div
      className={cn(
        globals.futureTheme === 'light' ? 'future-light' : 'future-dark',
        'min-h-screen w-full bg-future-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-4 text-[2rem] font-bold text-future-foreground">
          Apollo v.4 Design System
        </h1>
        <p className="mb-6 text-base leading-7 text-future-foreground-muted">
          Apollo v.4 is UiPath's open-source design system for building consistent user experiences
          across all UiPath products.
        </p>

        <div className="my-8 h-px bg-future-border-subtle" />

        <div className="mb-8">
          <span className="font-semibold text-future-foreground">Github repository</span>
          <br />
          <a
            href="https://github.com/UiPath/apollo-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="text-future-accent-foreground underline"
          >
            https://github.com/UiPath/apollo-ui
          </a>
        </div>

        <div className="my-8 h-px bg-future-border-subtle" />

        <h2 className="mb-4 mt-8 text-2xl font-bold text-future-foreground">Getting Started</h2>

        <h3 className="mb-3 mt-6 text-xl font-bold text-future-foreground">Prerequisites</h3>
        <ul className="mb-6 ml-6 list-disc leading-7 text-future-foreground-muted">
          <li>Node.js &gt;= 22</li>
          <li>pnpm &gt;= 10</li>
        </ul>

        <h3 className="mb-3 mt-6 text-xl font-bold text-future-foreground">Installation</h3>
        <pre
          className="mb-6 overflow-auto rounded-lg border border-future-border-subtle bg-future-surface-raised p-4 text-sm leading-6 text-future-foreground-secondary"
          style={{ fontFamily: fontFamily.monospace }}
        >
          <code>{`# Install pnpm if you haven't already
npm install -g pnpm

# Clone the repository
git clone https://github.com/UiPath/apollo-ui.git
cd apollo-ui

# Install dependencies
pnpm install

# Build all packages
pnpm build`}</code>
        </pre>

        <h3 className="mb-3 mt-6 text-xl font-bold text-future-foreground">Development</h3>
        <pre
          className="mb-6 overflow-auto rounded-lg border border-future-border-subtle bg-future-surface-raised p-4 text-sm leading-6 text-future-foreground-secondary"
          style={{ fontFamily: fontFamily.monospace }}
        >
          <code>{`# Run all packages in development mode
pnpm dev

# Run Storybook
pnpm storybook

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Run visual regression tests
pnpm test:visual`}</code>
        </pre>

        <h3 className="mb-3 mt-6 text-xl font-bold text-future-foreground">Building</h3>
        <pre
          className="mb-6 overflow-auto rounded-lg border border-future-border-subtle bg-future-surface-raised p-4 text-sm leading-6 text-future-foreground-secondary"
          style={{ fontFamily: fontFamily.monospace }}
        >
          <code>{`# Build all packages
pnpm build

# Build Storybook
pnpm storybook:build`}</code>
        </pre>
      </div>
    </div>
  ),
};
