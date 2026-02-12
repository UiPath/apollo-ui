import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', padding: '2rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Apollo v.4 Design System
      </h1>
      <p style={{ fontSize: '1rem', lineHeight: '1.75', marginBottom: '1.5rem' }}>
        Apollo v.4 is UiPath's open-source design system for building consistent user experiences
        across all UiPath products.
      </p>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <div style={{ marginBottom: '2rem' }}>
        <strong>Github repository</strong>
        <br />
        <a
          href="https://github.com/UiPath/apollo-ui"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0066cc', textDecoration: 'underline' }}
        >
          https://github.com/UiPath/apollo-ui
        </a>
      </div>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <h2
        style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }}
      >
        Getting Started
      </h2>

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
        }}
      >
        Prerequisites
      </h3>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.75' }}>
        <li>Node.js &gt;= 22</li>
        <li>pnpm &gt;= 10</li>
      </ul>

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
        }}
      >
        Installation
      </h3>
      <pre
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          marginBottom: '1.5rem',
        }}
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

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
        }}
      >
        Development
      </h3>
      <pre
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          marginBottom: '1.5rem',
        }}
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

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginTop: '1.5rem',
          marginBottom: '0.75rem',
        }}
      >
        Building
      </h3>
      <pre
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          marginBottom: '1.5rem',
        }}
      >
        <code>{`# Build all packages
pnpm build

# Build Storybook
pnpm storybook:build`}</code>
      </pre>
    </div>
  ),
};
