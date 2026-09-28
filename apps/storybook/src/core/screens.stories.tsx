import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScreenSizes } from '@uipath/apollo-react/core';
import { PageContainer, PageDescription, PageTitle, PRIMARY_GRADIENT, SHADOW_SM } from './shared';

const meta = {
  title: 'Theme/Screens',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Subtle primary tint (was --color-background-tint-primary in the playground)
const BACKGROUND_TINT_PRIMARY = 'rgba(102, 126, 234, 0.05)';

const cardStyle = {
  background: 'var(--color-background)',
  border: '2px solid var(--color-border)',
  borderRadius: 12,
  boxShadow: SHADOW_SM,
} as const;

function ScreensPage() {
  // Use the ScreenSizes namespace which contains only screen size tokens
  const screens = Object.entries(ScreenSizes)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  return (
    <PageContainer>
      <PageTitle>Breakpoints</PageTitle>
      <PageDescription>Responsive screen size breakpoints ({screens.length} sizes)</PageDescription>

      {/* Overview */}
      <div style={{ ...cardStyle, padding: 32, marginBottom: 40 }}>
        <h3 style={{ marginTop: 0, marginBottom: 24, color: 'var(--color-foreground-emp)' }}>
          Breakpoint Overview
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
          }}
        >
          {screens.map((screen) => (
            <div
              key={screen.name}
              style={{
                background: 'var(--color-background-hover)',
                border: '2px solid var(--color-border)',
                borderRadius: 8,
                padding: '16px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: 'var(--color-primary)',
                  marginBottom: 8,
                }}
              >
                {screen.name.replace('Screen', '')}
              </div>
              <div
                style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--color-foreground-emp)' }}
              >
                {screen.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-breakpoint cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {screens.map((screen) => {
          const widthPx = parseFloat(screen.value);
          const deviceType =
            widthPx < 640
              ? '📱 Mobile'
              : widthPx < 1024
                ? '📱 Tablet'
                : widthPx < 1440
                  ? '💻 Laptop'
                  : '🖥️ Desktop';

          return (
            <div key={screen.name} style={{ ...cardStyle, padding: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {screen.name}
                  </div>
                  <code style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>
                    {screen.value}
                  </code>
                </div>
                <div style={{ fontSize: 32 }}>{deviceType}</div>
              </div>

              <div
                style={{
                  background: 'var(--color-background-hover)',
                  borderRadius: 8,
                  padding: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {widthPx === 0 ? (
                  <div
                    style={{
                      width: '100%',
                      height: 120,
                      border: '2px dashed var(--color-primary)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      fontSize: 16,
                      fontWeight: 'bold',
                      background: BACKGROUND_TINT_PRIMARY,
                    }}
                  >
                    Base / Minimum (0px and up)
                  </div>
                ) : (
                  <div
                    style={{
                      width: `min(100%, ${screen.value})`,
                      height: 120,
                      background: PRIMARY_GRADIENT,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-background)',
                      fontSize: 16,
                      fontWeight: 'bold',
                      transition: 'all 0.3s',
                    }}
                  >
                    {screen.value} viewport
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: 'var(--color-background-hover)',
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: 'var(--color-foreground-emp)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                @media (min-width: {screen.value}){' '}
                {`{\n  /* Styles for ${screen.name} and up */\n}`}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}

export const All: Story = {
  render: () => <ScreensPage />,
};
