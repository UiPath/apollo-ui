import type { Meta, StoryObj } from '@storybook/react-vite';
import { Shadow } from '@uipath/apollo-react/core';
import { BRAND_GRADIENT, PageContainer, PageDescription, PageTitle } from './shared';

const meta = {
  title: 'Theme/Shadows',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ShadowsPage() {
  // Use the Shadow namespace which contains only shadow tokens
  const shadows = Object.entries(Shadow).map(([name, value]) => ({
    name,
    value: value as string,
  }));

  return (
    <PageContainer>
      <PageTitle>Shadows</PageTitle>
      <PageDescription>
        Elevation system for depth and hierarchy ({shadows.length} shadows)
      </PageDescription>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 40,
        }}
      >
        {shadows.map((shadow) => (
          <div key={shadow.name} style={{ textAlign: 'center' }}>
            <div
              className="sb-core-lift"
              style={{
                background: 'var(--color-background)',
                borderRadius: 16,
                padding: 40,
                boxShadow: shadow.value,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Gradient box so the shadow stays visible in dark themes */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: BRAND_GRADIENT,
                  borderRadius: 12,
                  marginBottom: 20,
                  boxShadow: shadow.value,
                }}
              />
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'var(--color-primary)',
                  marginBottom: 12,
                }}
              >
                {shadow.name}
              </h3>
              <code
                style={{
                  fontSize: 12,
                  color: 'var(--color-foreground-de-emp)',
                  background: 'var(--color-background-hover)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  wordBreak: 'break-all',
                  maxWidth: '100%',
                }}
              >
                {shadow.value}
              </code>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <ShadowsPage />,
};
