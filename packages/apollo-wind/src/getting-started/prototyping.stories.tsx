import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Introduction/Prototyping',
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
        Prototyping with Apollo
      </h1>
      <p style={{ fontSize: '1rem', lineHeight: '1.75', marginBottom: '1rem' }}>
        Rapid prototyping is central to our approach, enabling high-quality UX, consistency, and
        efficiency. This section explores how Design and AI work together to help teams align and
        deliver consistent outcomes.
      </p>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Use Figma</h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.75' }}>Redacted</p>
      </section>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Use AI</h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.75' }}>Coming soon</p>
      </section>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Best practices
        </h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.75' }}>Coming soon</p>
      </section>

      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
    </div>
  ),
};
