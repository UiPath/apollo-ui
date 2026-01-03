import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'Design Foundation/Spacing',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SPACING_SCALE = [
  { name: '0', value: '0px', class: '0' },
  { name: 'px', value: '1px', class: 'px' },
  { name: '0.5', value: '2px', class: '0.5' },
  { name: '1', value: '4px', class: '1' },
  { name: '1.5', value: '6px', class: '1.5' },
  { name: '2', value: '8px', class: '2' },
  { name: '2.5', value: '10px', class: '2.5' },
  { name: '3', value: '12px', class: '3' },
  { name: '3.5', value: '14px', class: '3.5' },
  { name: '4', value: '16px', class: '4' },
  { name: '5', value: '20px', class: '5' },
  { name: '6', value: '24px', class: '6' },
  { name: '7', value: '28px', class: '7' },
  { name: '8', value: '32px', class: '8' },
  { name: '9', value: '36px', class: '9' },
  { name: '10', value: '40px', class: '10' },
  { name: '11', value: '44px', class: '11' },
  { name: '12', value: '48px', class: '12' },
  { name: '14', value: '56px', class: '14' },
  { name: '16', value: '64px', class: '16' },
  { name: '20', value: '80px', class: '20' },
  { name: '24', value: '96px', class: '24' },
  { name: '28', value: '112px', class: '28' },
  { name: '32', value: '128px', class: '32' },
  { name: '36', value: '144px', class: '36' },
  { name: '40', value: '160px', class: '40' },
  { name: '44', value: '176px', class: '44' },
  { name: '48', value: '192px', class: '48' },
  { name: '52', value: '208px', class: '52' },
  { name: '56', value: '224px', class: '56' },
  { name: '60', value: '240px', class: '60' },
  { name: '64', value: '256px', class: '64' },
  { name: '72', value: '288px', class: '72' },
  { name: '80', value: '320px', class: '80' },
  { name: '96', value: '384px', class: '96' },
];

function SpacingGallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Spacing System
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Tailwind CSS spacing scale for margin, padding, gap, dimensions, and border radius
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-10 max-w-7xl mx-auto space-y-16">
        {/* Spacing Scale */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Spacing Scale</h2>
          <p className="text-muted-foreground max-w-2xl">
            The default spacing scale follows a 4px base unit. Use these values for padding (p-),
            margin (m-), gap, width (w-), and height (h-) utilities.
          </p>
          <div className="grid gap-2">
            {SPACING_SCALE.map((space) => (
              <div key={space.name} className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono text-muted-foreground">{space.name}</div>
                <div className="w-20 text-sm text-muted-foreground">{space.value}</div>
                <div
                  className="h-4 bg-primary rounded"
                  style={{ width: space.value === '0px' ? '2px' : space.value }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Padding Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Padding</h2>
          <p className="text-muted-foreground">
            Apply padding to all sides, individual sides, or axes using p-, px-, py-, pt-, pr-, pb-,
            pl- utilities.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="p-4 rounded-lg bg-accent">
                <div className="bg-card border rounded px-3 py-2 text-sm font-medium">Content</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                p-4 (16px all sides)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="px-6 py-2 rounded-lg bg-accent">
                <div className="bg-card border rounded px-3 py-2 text-sm font-medium">Content</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                px-6 py-2 (24px x, 8px y)
              </Badge>
            </div>

            <div className="space-y-2">
              <div
                className="rounded-lg bg-accent"
                style={{
                  paddingTop: '32px',
                  paddingRight: '16px',
                  paddingBottom: '8px',
                  paddingLeft: '24px',
                }}
              >
                <div className="bg-card border rounded px-3 py-2 text-sm font-medium">Content</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                pt-8 pr-4 pb-2 pl-6
              </Badge>
            </div>
          </div>
        </section>

        {/* Margin Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Margin</h2>
          <p className="text-muted-foreground">
            Apply margin using m-, mx-, my-, mt-, mr-, mb-, ml- utilities. Negative margins are
            available with -m- prefix.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="rounded-lg flex items-start bg-accent">
                <div className="bg-muted/80 px-2 py-1 text-xs text-muted-foreground">Ref</div>
                <div className="m-4">
                  <div className="bg-card border rounded px-3 py-2 text-sm font-medium">
                    Content
                  </div>
                </div>
                <div className="bg-muted/80 px-2 py-1 text-xs text-muted-foreground self-end">
                  Ref
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                m-4 (16px all sides)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg flex justify-center py-4 bg-accent">
                <div className="bg-card border rounded px-3 py-2 text-center text-sm font-medium">
                  Content
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                mx-auto (center horizontally)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg flex items-center bg-accent">
                <div className="bg-muted/80 px-2 py-1 text-xs text-muted-foreground">Ref</div>
                <div className="ml-8 my-2 mr-2">
                  <div className="bg-card border rounded px-3 py-2 text-sm font-medium">
                    Content
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                ml-8 (32px left margin)
              </Badge>
            </div>
          </div>
        </section>

        {/* Gap Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Gap</h2>
          <p className="text-muted-foreground">
            Use gap utilities with flexbox and grid layouts to control spacing between items.
          </p>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  1
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  2
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                gap-2 (8px)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  1
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  2
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                gap-4 (16px)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex gap-8">
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  1
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  2
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                gap-8 (32px)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 w-fit" style={{ columnGap: '32px', rowGap: '8px' }}>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  1
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  2
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  3
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  4
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  5
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  6
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                gap-x-8 gap-y-2 (different x/y gaps)
              </Badge>
            </div>
          </div>
        </section>

        {/* Space Between */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Space Between</h2>
          <p className="text-muted-foreground">
            Use space-x-* and space-y-* utilities to add margin between child elements.
          </p>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex" style={{ gap: '16px' }}>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                space-x-4 (16px between)
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="space-y-2 w-fit">
                <div className="w-24 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div className="w-24 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div className="w-24 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                space-y-2 (8px between)
              </Badge>
            </div>
          </div>
        </section>

        {/* Common Patterns */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Common Patterns</h2>
          <p className="text-muted-foreground">
            Recommended spacing patterns for common UI elements.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Card Padding</h3>
              <div className="border rounded-lg p-6 bg-card">
                <p className="text-sm">Standard card with p-6 (24px) padding</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                p-6 for cards
              </Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Button Padding</h3>
              <div className="flex gap-4 items-center">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                  Default
                </button>
                <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
                  Small
                </button>
                <button className="px-8 py-3 bg-primary text-primary-foreground rounded-md text-sm">
                  Large
                </button>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                px-4 py-2, px-3 py-1.5, px-8 py-3
              </Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Section Spacing</h3>
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                  Section 1
                </div>
                <div className="h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                  Section 2
                </div>
                <div className="h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                  Section 3
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                space-y-4 between sections
              </Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Page Container</h3>
              <div className="border rounded-lg bg-primary/10 border-primary/20">
                <div className="px-8 py-10 bg-card rounded-lg text-center text-sm border">
                  px-8 py-10 for page content
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                px-8 py-10 for page containers
              </Badge>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Border Radius</h2>
          <p className="text-muted-foreground">
            Semantic border radius tokens defined as CSS variables. Use rounded-* utilities to
            apply.
          </p>

          {/* Radius Scale */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Radius Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: '0px' }}
                >
                  none
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-none (0px)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  sm
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-sm (0.25rem)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  md
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-md (0.375rem)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  lg
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-lg (0.5rem)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                >
                  xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-xl (0.75rem)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-2xl)' }}
                >
                  2xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-2xl (1rem)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  full
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-full (9999px)
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  default
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  --radius (0.5rem)
                </Badge>
              </div>
            </div>
          </div>

          {/* Individual Corners */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Corners</h3>
            <p className="text-sm text-muted-foreground">
              Apply radius to specific corners using rounded-t-*, rounded-r-*, rounded-b-*,
              rounded-l-*, or specific corners like rounded-tl-*, rounded-tr-*, etc.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{
                    borderTopLeftRadius: '1rem',
                    borderTopRightRadius: '1rem',
                  }}
                >
                  t-2xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-t-2xl
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{
                    borderBottomLeftRadius: '1rem',
                    borderBottomRightRadius: '1rem',
                  }}
                >
                  b-2xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-b-2xl
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{
                    borderTopLeftRadius: '1rem',
                    borderBottomLeftRadius: '1rem',
                  }}
                >
                  l-2xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-l-2xl
                </Badge>
              </div>

              <div className="space-y-2">
                <div
                  className="w-full h-20 bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{
                    borderTopRightRadius: '1rem',
                    borderBottomRightRadius: '1rem',
                  }}
                >
                  r-2xl
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-r-2xl
                </Badge>
              </div>
            </div>
          </div>

          {/* Common Radius Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Common Usage</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                  Button
                </button>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-md for buttons
                </Badge>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Input field"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                />
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-md for inputs
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="border rounded-lg p-4 bg-card text-sm">Card content</div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-lg for cards
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="border rounded-xl p-4 bg-card text-sm">Modal/Dialog</div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-xl for modals
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Badge
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-full for pills/badges
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  AV
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  rounded-full for avatars
                </Badge>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const Default = {
  render: () => <SpacingGallery />,
} satisfies Story;
