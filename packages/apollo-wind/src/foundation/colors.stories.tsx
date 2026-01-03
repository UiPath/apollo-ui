import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const meta = {
  title: 'Design Foundation/Colors',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ColorSwatch = ({
  name,
  cssVar,
  description,
  compact = false,
}: {
  name: string;
  cssVar: string;
  description?: string;
  compact?: boolean;
}) => (
  <Card>
    <CardContent className="p-0">
      <div
        className={`w-full rounded-t-lg ${compact ? 'h-16' : 'h-24'}`}
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className={`space-y-1 ${compact ? 'p-2' : 'p-4 space-y-2'}`}>
        <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{name}</p>
        <Badge variant="outline" className="font-mono text-xs">
          {cssVar}
        </Badge>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

const TailwindColorSwatch = ({
  name,
  bgClass,
  hex,
}: {
  name: string;
  bgClass: string;
  hex: string;
}) => (
  <div className="flex flex-col">
    <div className={`h-10 w-full rounded-t-md ${bgClass}`} />
    <div className="bg-card border border-t-0 rounded-b-md p-2 space-y-0.5">
      <p className="text-xs font-medium">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{hex}</p>
    </div>
  </div>
);

const ColorGroup = ({
  title,
  colors,
  compact = false,
}: {
  title: string;
  colors: Array<{ name: string; cssVar: string; description?: string }>;
  compact?: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div
      className={`grid gap-4 ${compact ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}`}
    >
      {colors.map((color) => (
        <ColorSwatch key={color.cssVar} {...color} compact={compact} />
      ))}
    </div>
  </div>
);

const TailwindColorScale = ({
  name,
  shades,
}: {
  name: string;
  shades: Array<{ shade: string; bgClass: string; hex: string }>;
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium capitalize">{name}</h4>
    <div className="grid grid-cols-11 gap-1">
      {shades.map(({ shade, bgClass, hex }) => (
        <TailwindColorSwatch key={shade} name={shade} bgClass={bgClass} hex={hex} />
      ))}
    </div>
  </div>
);

// Tailwind's default color palette
const TAILWIND_COLORS = {
  slate: [
    { shade: '50', bgClass: 'bg-slate-50', hex: '#f8fafc' },
    { shade: '100', bgClass: 'bg-slate-100', hex: '#f1f5f9' },
    { shade: '200', bgClass: 'bg-slate-200', hex: '#e2e8f0' },
    { shade: '300', bgClass: 'bg-slate-300', hex: '#cbd5e1' },
    { shade: '400', bgClass: 'bg-slate-400', hex: '#94a3b8' },
    { shade: '500', bgClass: 'bg-slate-500', hex: '#64748b' },
    { shade: '600', bgClass: 'bg-slate-600', hex: '#475569' },
    { shade: '700', bgClass: 'bg-slate-700', hex: '#334155' },
    { shade: '800', bgClass: 'bg-slate-800', hex: '#1e293b' },
    { shade: '900', bgClass: 'bg-slate-900', hex: '#0f172a' },
    { shade: '950', bgClass: 'bg-slate-950', hex: '#020617' },
  ],
  gray: [
    { shade: '50', bgClass: 'bg-gray-50', hex: '#f9fafb' },
    { shade: '100', bgClass: 'bg-gray-100', hex: '#f3f4f6' },
    { shade: '200', bgClass: 'bg-gray-200', hex: '#e5e7eb' },
    { shade: '300', bgClass: 'bg-gray-300', hex: '#d1d5db' },
    { shade: '400', bgClass: 'bg-gray-400', hex: '#9ca3af' },
    { shade: '500', bgClass: 'bg-gray-500', hex: '#6b7280' },
    { shade: '600', bgClass: 'bg-gray-600', hex: '#4b5563' },
    { shade: '700', bgClass: 'bg-gray-700', hex: '#374151' },
    { shade: '800', bgClass: 'bg-gray-800', hex: '#1f2937' },
    { shade: '900', bgClass: 'bg-gray-900', hex: '#111827' },
    { shade: '950', bgClass: 'bg-gray-950', hex: '#030712' },
  ],
  zinc: [
    { shade: '50', bgClass: 'bg-zinc-50', hex: '#fafafa' },
    { shade: '100', bgClass: 'bg-zinc-100', hex: '#f4f4f5' },
    { shade: '200', bgClass: 'bg-zinc-200', hex: '#e4e4e7' },
    { shade: '300', bgClass: 'bg-zinc-300', hex: '#d4d4d8' },
    { shade: '400', bgClass: 'bg-zinc-400', hex: '#a1a1aa' },
    { shade: '500', bgClass: 'bg-zinc-500', hex: '#71717a' },
    { shade: '600', bgClass: 'bg-zinc-600', hex: '#52525b' },
    { shade: '700', bgClass: 'bg-zinc-700', hex: '#3f3f46' },
    { shade: '800', bgClass: 'bg-zinc-800', hex: '#27272a' },
    { shade: '900', bgClass: 'bg-zinc-900', hex: '#18181b' },
    { shade: '950', bgClass: 'bg-zinc-950', hex: '#09090b' },
  ],
  red: [
    { shade: '50', bgClass: 'bg-red-50', hex: '#fef2f2' },
    { shade: '100', bgClass: 'bg-red-100', hex: '#fee2e2' },
    { shade: '200', bgClass: 'bg-red-200', hex: '#fecaca' },
    { shade: '300', bgClass: 'bg-red-300', hex: '#fca5a5' },
    { shade: '400', bgClass: 'bg-red-400', hex: '#f87171' },
    { shade: '500', bgClass: 'bg-red-500', hex: '#ef4444' },
    { shade: '600', bgClass: 'bg-red-600', hex: '#dc2626' },
    { shade: '700', bgClass: 'bg-red-700', hex: '#b91c1c' },
    { shade: '800', bgClass: 'bg-red-800', hex: '#991b1b' },
    { shade: '900', bgClass: 'bg-red-900', hex: '#7f1d1d' },
    { shade: '950', bgClass: 'bg-red-950', hex: '#450a0a' },
  ],
  orange: [
    { shade: '50', bgClass: 'bg-orange-50', hex: '#fff7ed' },
    { shade: '100', bgClass: 'bg-orange-100', hex: '#ffedd5' },
    { shade: '200', bgClass: 'bg-orange-200', hex: '#fed7aa' },
    { shade: '300', bgClass: 'bg-orange-300', hex: '#fdba74' },
    { shade: '400', bgClass: 'bg-orange-400', hex: '#fb923c' },
    { shade: '500', bgClass: 'bg-orange-500', hex: '#f97316' },
    { shade: '600', bgClass: 'bg-orange-600', hex: '#ea580c' },
    { shade: '700', bgClass: 'bg-orange-700', hex: '#c2410c' },
    { shade: '800', bgClass: 'bg-orange-800', hex: '#9a3412' },
    { shade: '900', bgClass: 'bg-orange-900', hex: '#7c2d12' },
    { shade: '950', bgClass: 'bg-orange-950', hex: '#431407' },
  ],
  amber: [
    { shade: '50', bgClass: 'bg-amber-50', hex: '#fffbeb' },
    { shade: '100', bgClass: 'bg-amber-100', hex: '#fef3c7' },
    { shade: '200', bgClass: 'bg-amber-200', hex: '#fde68a' },
    { shade: '300', bgClass: 'bg-amber-300', hex: '#fcd34d' },
    { shade: '400', bgClass: 'bg-amber-400', hex: '#fbbf24' },
    { shade: '500', bgClass: 'bg-amber-500', hex: '#f59e0b' },
    { shade: '600', bgClass: 'bg-amber-600', hex: '#d97706' },
    { shade: '700', bgClass: 'bg-amber-700', hex: '#b45309' },
    { shade: '800', bgClass: 'bg-amber-800', hex: '#92400e' },
    { shade: '900', bgClass: 'bg-amber-900', hex: '#78350f' },
    { shade: '950', bgClass: 'bg-amber-950', hex: '#451a03' },
  ],
  yellow: [
    { shade: '50', bgClass: 'bg-yellow-50', hex: '#fefce8' },
    { shade: '100', bgClass: 'bg-yellow-100', hex: '#fef9c3' },
    { shade: '200', bgClass: 'bg-yellow-200', hex: '#fef08a' },
    { shade: '300', bgClass: 'bg-yellow-300', hex: '#fde047' },
    { shade: '400', bgClass: 'bg-yellow-400', hex: '#facc15' },
    { shade: '500', bgClass: 'bg-yellow-500', hex: '#eab308' },
    { shade: '600', bgClass: 'bg-yellow-600', hex: '#ca8a04' },
    { shade: '700', bgClass: 'bg-yellow-700', hex: '#a16207' },
    { shade: '800', bgClass: 'bg-yellow-800', hex: '#854d0e' },
    { shade: '900', bgClass: 'bg-yellow-900', hex: '#713f12' },
    { shade: '950', bgClass: 'bg-yellow-950', hex: '#422006' },
  ],
  green: [
    { shade: '50', bgClass: 'bg-green-50', hex: '#f0fdf4' },
    { shade: '100', bgClass: 'bg-green-100', hex: '#dcfce7' },
    { shade: '200', bgClass: 'bg-green-200', hex: '#bbf7d0' },
    { shade: '300', bgClass: 'bg-green-300', hex: '#86efac' },
    { shade: '400', bgClass: 'bg-green-400', hex: '#4ade80' },
    { shade: '500', bgClass: 'bg-green-500', hex: '#22c55e' },
    { shade: '600', bgClass: 'bg-green-600', hex: '#16a34a' },
    { shade: '700', bgClass: 'bg-green-700', hex: '#15803d' },
    { shade: '800', bgClass: 'bg-green-800', hex: '#166534' },
    { shade: '900', bgClass: 'bg-green-900', hex: '#14532d' },
    { shade: '950', bgClass: 'bg-green-950', hex: '#052e16' },
  ],
  emerald: [
    { shade: '50', bgClass: 'bg-emerald-50', hex: '#ecfdf5' },
    { shade: '100', bgClass: 'bg-emerald-100', hex: '#d1fae5' },
    { shade: '200', bgClass: 'bg-emerald-200', hex: '#a7f3d0' },
    { shade: '300', bgClass: 'bg-emerald-300', hex: '#6ee7b7' },
    { shade: '400', bgClass: 'bg-emerald-400', hex: '#34d399' },
    { shade: '500', bgClass: 'bg-emerald-500', hex: '#10b981' },
    { shade: '600', bgClass: 'bg-emerald-600', hex: '#059669' },
    { shade: '700', bgClass: 'bg-emerald-700', hex: '#047857' },
    { shade: '800', bgClass: 'bg-emerald-800', hex: '#065f46' },
    { shade: '900', bgClass: 'bg-emerald-900', hex: '#064e3b' },
    { shade: '950', bgClass: 'bg-emerald-950', hex: '#022c22' },
  ],
  teal: [
    { shade: '50', bgClass: 'bg-teal-50', hex: '#f0fdfa' },
    { shade: '100', bgClass: 'bg-teal-100', hex: '#ccfbf1' },
    { shade: '200', bgClass: 'bg-teal-200', hex: '#99f6e4' },
    { shade: '300', bgClass: 'bg-teal-300', hex: '#5eead4' },
    { shade: '400', bgClass: 'bg-teal-400', hex: '#2dd4bf' },
    { shade: '500', bgClass: 'bg-teal-500', hex: '#14b8a6' },
    { shade: '600', bgClass: 'bg-teal-600', hex: '#0d9488' },
    { shade: '700', bgClass: 'bg-teal-700', hex: '#0f766e' },
    { shade: '800', bgClass: 'bg-teal-800', hex: '#115e59' },
    { shade: '900', bgClass: 'bg-teal-900', hex: '#134e4a' },
    { shade: '950', bgClass: 'bg-teal-950', hex: '#042f2e' },
  ],
  cyan: [
    { shade: '50', bgClass: 'bg-cyan-50', hex: '#ecfeff' },
    { shade: '100', bgClass: 'bg-cyan-100', hex: '#cffafe' },
    { shade: '200', bgClass: 'bg-cyan-200', hex: '#a5f3fc' },
    { shade: '300', bgClass: 'bg-cyan-300', hex: '#67e8f9' },
    { shade: '400', bgClass: 'bg-cyan-400', hex: '#22d3ee' },
    { shade: '500', bgClass: 'bg-cyan-500', hex: '#06b6d4' },
    { shade: '600', bgClass: 'bg-cyan-600', hex: '#0891b2' },
    { shade: '700', bgClass: 'bg-cyan-700', hex: '#0e7490' },
    { shade: '800', bgClass: 'bg-cyan-800', hex: '#155e75' },
    { shade: '900', bgClass: 'bg-cyan-900', hex: '#164e63' },
    { shade: '950', bgClass: 'bg-cyan-950', hex: '#083344' },
  ],
  sky: [
    { shade: '50', bgClass: 'bg-sky-50', hex: '#f0f9ff' },
    { shade: '100', bgClass: 'bg-sky-100', hex: '#e0f2fe' },
    { shade: '200', bgClass: 'bg-sky-200', hex: '#bae6fd' },
    { shade: '300', bgClass: 'bg-sky-300', hex: '#7dd3fc' },
    { shade: '400', bgClass: 'bg-sky-400', hex: '#38bdf8' },
    { shade: '500', bgClass: 'bg-sky-500', hex: '#0ea5e9' },
    { shade: '600', bgClass: 'bg-sky-600', hex: '#0284c7' },
    { shade: '700', bgClass: 'bg-sky-700', hex: '#0369a1' },
    { shade: '800', bgClass: 'bg-sky-800', hex: '#075985' },
    { shade: '900', bgClass: 'bg-sky-900', hex: '#0c4a6e' },
    { shade: '950', bgClass: 'bg-sky-950', hex: '#082f49' },
  ],
  blue: [
    { shade: '50', bgClass: 'bg-blue-50', hex: '#eff6ff' },
    { shade: '100', bgClass: 'bg-blue-100', hex: '#dbeafe' },
    { shade: '200', bgClass: 'bg-blue-200', hex: '#bfdbfe' },
    { shade: '300', bgClass: 'bg-blue-300', hex: '#93c5fd' },
    { shade: '400', bgClass: 'bg-blue-400', hex: '#60a5fa' },
    { shade: '500', bgClass: 'bg-blue-500', hex: '#3b82f6' },
    { shade: '600', bgClass: 'bg-blue-600', hex: '#2563eb' },
    { shade: '700', bgClass: 'bg-blue-700', hex: '#1d4ed8' },
    { shade: '800', bgClass: 'bg-blue-800', hex: '#1e40af' },
    { shade: '900', bgClass: 'bg-blue-900', hex: '#1e3a8a' },
    { shade: '950', bgClass: 'bg-blue-950', hex: '#172554' },
  ],
  indigo: [
    { shade: '50', bgClass: 'bg-indigo-50', hex: '#eef2ff' },
    { shade: '100', bgClass: 'bg-indigo-100', hex: '#e0e7ff' },
    { shade: '200', bgClass: 'bg-indigo-200', hex: '#c7d2fe' },
    { shade: '300', bgClass: 'bg-indigo-300', hex: '#a5b4fc' },
    { shade: '400', bgClass: 'bg-indigo-400', hex: '#818cf8' },
    { shade: '500', bgClass: 'bg-indigo-500', hex: '#6366f1' },
    { shade: '600', bgClass: 'bg-indigo-600', hex: '#4f46e5' },
    { shade: '700', bgClass: 'bg-indigo-700', hex: '#4338ca' },
    { shade: '800', bgClass: 'bg-indigo-800', hex: '#3730a3' },
    { shade: '900', bgClass: 'bg-indigo-900', hex: '#312e81' },
    { shade: '950', bgClass: 'bg-indigo-950', hex: '#1e1b4b' },
  ],
  violet: [
    { shade: '50', bgClass: 'bg-violet-50', hex: '#f5f3ff' },
    { shade: '100', bgClass: 'bg-violet-100', hex: '#ede9fe' },
    { shade: '200', bgClass: 'bg-violet-200', hex: '#ddd6fe' },
    { shade: '300', bgClass: 'bg-violet-300', hex: '#c4b5fd' },
    { shade: '400', bgClass: 'bg-violet-400', hex: '#a78bfa' },
    { shade: '500', bgClass: 'bg-violet-500', hex: '#8b5cf6' },
    { shade: '600', bgClass: 'bg-violet-600', hex: '#7c3aed' },
    { shade: '700', bgClass: 'bg-violet-700', hex: '#6d28d9' },
    { shade: '800', bgClass: 'bg-violet-800', hex: '#5b21b6' },
    { shade: '900', bgClass: 'bg-violet-900', hex: '#4c1d95' },
    { shade: '950', bgClass: 'bg-violet-950', hex: '#2e1065' },
  ],
  purple: [
    { shade: '50', bgClass: 'bg-purple-50', hex: '#faf5ff' },
    { shade: '100', bgClass: 'bg-purple-100', hex: '#f3e8ff' },
    { shade: '200', bgClass: 'bg-purple-200', hex: '#e9d5ff' },
    { shade: '300', bgClass: 'bg-purple-300', hex: '#d8b4fe' },
    { shade: '400', bgClass: 'bg-purple-400', hex: '#c084fc' },
    { shade: '500', bgClass: 'bg-purple-500', hex: '#a855f7' },
    { shade: '600', bgClass: 'bg-purple-600', hex: '#9333ea' },
    { shade: '700', bgClass: 'bg-purple-700', hex: '#7e22ce' },
    { shade: '800', bgClass: 'bg-purple-800', hex: '#6b21a8' },
    { shade: '900', bgClass: 'bg-purple-900', hex: '#581c87' },
    { shade: '950', bgClass: 'bg-purple-950', hex: '#3b0764' },
  ],
  fuchsia: [
    { shade: '50', bgClass: 'bg-fuchsia-50', hex: '#fdf4ff' },
    { shade: '100', bgClass: 'bg-fuchsia-100', hex: '#fae8ff' },
    { shade: '200', bgClass: 'bg-fuchsia-200', hex: '#f5d0fe' },
    { shade: '300', bgClass: 'bg-fuchsia-300', hex: '#f0abfc' },
    { shade: '400', bgClass: 'bg-fuchsia-400', hex: '#e879f9' },
    { shade: '500', bgClass: 'bg-fuchsia-500', hex: '#d946ef' },
    { shade: '600', bgClass: 'bg-fuchsia-600', hex: '#c026d3' },
    { shade: '700', bgClass: 'bg-fuchsia-700', hex: '#a21caf' },
    { shade: '800', bgClass: 'bg-fuchsia-800', hex: '#86198f' },
    { shade: '900', bgClass: 'bg-fuchsia-900', hex: '#701a75' },
    { shade: '950', bgClass: 'bg-fuchsia-950', hex: '#4a044e' },
  ],
  pink: [
    { shade: '50', bgClass: 'bg-pink-50', hex: '#fdf2f8' },
    { shade: '100', bgClass: 'bg-pink-100', hex: '#fce7f3' },
    { shade: '200', bgClass: 'bg-pink-200', hex: '#fbcfe8' },
    { shade: '300', bgClass: 'bg-pink-300', hex: '#f9a8d4' },
    { shade: '400', bgClass: 'bg-pink-400', hex: '#f472b6' },
    { shade: '500', bgClass: 'bg-pink-500', hex: '#ec4899' },
    { shade: '600', bgClass: 'bg-pink-600', hex: '#db2777' },
    { shade: '700', bgClass: 'bg-pink-700', hex: '#be185d' },
    { shade: '800', bgClass: 'bg-pink-800', hex: '#9d174d' },
    { shade: '900', bgClass: 'bg-pink-900', hex: '#831843' },
    { shade: '950', bgClass: 'bg-pink-950', hex: '#500724' },
  ],
  rose: [
    { shade: '50', bgClass: 'bg-rose-50', hex: '#fff1f2' },
    { shade: '100', bgClass: 'bg-rose-100', hex: '#ffe4e6' },
    { shade: '200', bgClass: 'bg-rose-200', hex: '#fecdd3' },
    { shade: '300', bgClass: 'bg-rose-300', hex: '#fda4af' },
    { shade: '400', bgClass: 'bg-rose-400', hex: '#fb7185' },
    { shade: '500', bgClass: 'bg-rose-500', hex: '#f43f5e' },
    { shade: '600', bgClass: 'bg-rose-600', hex: '#e11d48' },
    { shade: '700', bgClass: 'bg-rose-700', hex: '#be123c' },
    { shade: '800', bgClass: 'bg-rose-800', hex: '#9f1239' },
    { shade: '900', bgClass: 'bg-rose-900', hex: '#881337' },
    { shade: '950', bgClass: 'bg-rose-950', hex: '#4c0519' },
  ],
};

function ColorsGallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Color System
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Semantic color tokens that adapt to light and dark mode
          </p>
        </div>
      </div>

      {/* Color Groups */}
      <div className="px-8 py-10 max-w-7xl mx-auto space-y-16">
        {/* Semantic Colors Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Semantic Colors</h2>
            <p className="text-muted-foreground mt-1">
              Theme-aware colors that adapt to light/dark mode. Used via CSS variables.
            </p>
          </div>

          <ColorGroup
            title="Primary Colors"
            colors={[
              {
                name: 'Primary',
                cssVar: '--color-primary',
                description: 'Main brand color',
              },
              {
                name: 'Primary Foreground',
                cssVar: '--color-primary-foreground',
                description: 'Text on primary',
              },
            ]}
          />

          <ColorGroup
            title="Secondary Colors"
            colors={[
              {
                name: 'Secondary',
                cssVar: '--color-secondary',
                description: 'Secondary actions',
              },
              {
                name: 'Secondary Foreground',
                cssVar: '--color-secondary-foreground',
                description: 'Text on secondary',
              },
            ]}
          />

          <ColorGroup
            title="Background Colors"
            colors={[
              {
                name: 'Background',
                cssVar: '--color-background',
                description: 'Page background',
              },
              {
                name: 'Foreground',
                cssVar: '--color-foreground',
                description: 'Default text color',
              },
            ]}
          />

          <ColorGroup
            title="Muted Colors"
            colors={[
              {
                name: 'Muted',
                cssVar: '--color-muted',
                description: 'Subtle backgrounds',
              },
              {
                name: 'Muted Foreground',
                cssVar: '--color-muted-foreground',
                description: 'Secondary text',
              },
            ]}
          />

          <ColorGroup
            title="Accent Colors"
            colors={[
              {
                name: 'Accent',
                cssVar: '--color-accent',
                description: 'Highlight elements',
              },
              {
                name: 'Accent Foreground',
                cssVar: '--color-accent-foreground',
                description: 'Text on accent',
              },
            ]}
          />

          <ColorGroup
            title="Destructive Colors"
            colors={[
              {
                name: 'Destructive',
                cssVar: '--color-destructive',
                description: 'Errors and danger',
              },
              {
                name: 'Destructive Foreground',
                cssVar: '--color-destructive-foreground',
                description: 'Text on destructive',
              },
            ]}
          />

          <ColorGroup
            title="Surface Colors"
            colors={[
              {
                name: 'Card',
                cssVar: '--color-card',
                description: 'Card backgrounds',
              },
              {
                name: 'Card Foreground',
                cssVar: '--color-card-foreground',
                description: 'Text on cards',
              },
              {
                name: 'Popover',
                cssVar: '--color-popover',
                description: 'Popover backgrounds',
              },
              {
                name: 'Popover Foreground',
                cssVar: '--color-popover-foreground',
                description: 'Text on popovers',
              },
            ]}
          />

          <ColorGroup
            title="Border & Input Colors"
            colors={[
              {
                name: 'Border',
                cssVar: '--color-border',
                description: 'Default borders',
              },
              {
                name: 'Input',
                cssVar: '--color-input',
                description: 'Input borders',
              },
              {
                name: 'Ring',
                cssVar: '--color-ring',
                description: 'Focus rings',
              },
            ]}
          />
        </section>

        {/* Chart Colors Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Chart Colors</h2>
            <p className="text-muted-foreground mt-1">
              Colors for data visualization. Available in themed variants.
            </p>
          </div>

          <ColorGroup
            title="Chart Palette"
            colors={[
              {
                name: 'Chart 1',
                cssVar: '--color-chart-1',
                description: 'Primary chart color',
              },
              {
                name: 'Chart 2',
                cssVar: '--color-chart-2',
                description: 'Secondary chart color',
              },
              {
                name: 'Chart 3',
                cssVar: '--color-chart-3',
                description: 'Tertiary chart color',
              },
              {
                name: 'Chart 4',
                cssVar: '--color-chart-4',
                description: 'Quaternary chart color',
              },
              {
                name: 'Chart 5',
                cssVar: '--color-chart-5',
                description: 'Quinary chart color',
              },
            ]}
            compact
          />
        </section>

        {/* Sidebar Colors Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sidebar Colors</h2>
            <p className="text-muted-foreground mt-1">
              Dedicated colors for sidebar navigation components.
            </p>
          </div>

          <ColorGroup
            title="Sidebar Palette"
            colors={[
              {
                name: 'Sidebar',
                cssVar: '--color-sidebar',
                description: 'Sidebar background',
              },
              {
                name: 'Sidebar Foreground',
                cssVar: '--color-sidebar-foreground',
                description: 'Sidebar text',
              },
              {
                name: 'Sidebar Primary',
                cssVar: '--color-sidebar-primary',
                description: 'Active item background',
              },
              {
                name: 'Sidebar Primary FG',
                cssVar: '--color-sidebar-primary-foreground',
                description: 'Active item text',
              },
              {
                name: 'Sidebar Accent',
                cssVar: '--color-sidebar-accent',
                description: 'Hover state',
              },
              {
                name: 'Sidebar Accent FG',
                cssVar: '--color-sidebar-accent-foreground',
                description: 'Hover text',
              },
              {
                name: 'Sidebar Border',
                cssVar: '--color-sidebar-border',
                description: 'Sidebar borders',
              },
              {
                name: 'Sidebar Ring',
                cssVar: '--color-sidebar-ring',
                description: 'Focus ring',
              },
            ]}
            compact
          />
        </section>

        {/* Tailwind Color Palette Section */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Tailwind Color Palette</h2>
            <p className="text-muted-foreground mt-1">
              Built-in Tailwind CSS colors. Unlike semantic colors (which use CSS variables), these
              are used directly via utility classes.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm font-medium">Usage Examples:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Background:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded border">
                    className="bg-blue-500"
                  </code>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Text color:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded border">
                    className="text-red-600"
                  </code>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Border:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded border">
                    className="border-gray-300"
                  </code>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Ring/outline:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded border">
                    className="ring-emerald-500"
                  </code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Prefer semantic colors (bg-primary, text-muted-foreground) for theme
                consistency. Use Tailwind colors for one-off styling needs.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Grays */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Grays</h3>
              <div className="space-y-4">
                <TailwindColorScale name="slate" shades={TAILWIND_COLORS.slate} />
                <TailwindColorScale name="gray" shades={TAILWIND_COLORS.gray} />
                <TailwindColorScale name="zinc" shades={TAILWIND_COLORS.zinc} />
              </div>
            </div>

            {/* Warm Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Warm Colors</h3>
              <div className="space-y-4">
                <TailwindColorScale name="red" shades={TAILWIND_COLORS.red} />
                <TailwindColorScale name="orange" shades={TAILWIND_COLORS.orange} />
                <TailwindColorScale name="amber" shades={TAILWIND_COLORS.amber} />
                <TailwindColorScale name="yellow" shades={TAILWIND_COLORS.yellow} />
              </div>
            </div>

            {/* Green Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Green Colors</h3>
              <div className="space-y-4">
                <TailwindColorScale name="green" shades={TAILWIND_COLORS.green} />
                <TailwindColorScale name="emerald" shades={TAILWIND_COLORS.emerald} />
                <TailwindColorScale name="teal" shades={TAILWIND_COLORS.teal} />
              </div>
            </div>

            {/* Blue Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Blue Colors</h3>
              <div className="space-y-4">
                <TailwindColorScale name="cyan" shades={TAILWIND_COLORS.cyan} />
                <TailwindColorScale name="sky" shades={TAILWIND_COLORS.sky} />
                <TailwindColorScale name="blue" shades={TAILWIND_COLORS.blue} />
              </div>
            </div>

            {/* Purple Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purple Colors</h3>
              <div className="space-y-4">
                <TailwindColorScale name="indigo" shades={TAILWIND_COLORS.indigo} />
                <TailwindColorScale name="violet" shades={TAILWIND_COLORS.violet} />
                <TailwindColorScale name="purple" shades={TAILWIND_COLORS.purple} />
              </div>
            </div>

            {/* Pink Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pink Colors</h3>
              <div className="space-y-4">
                <TailwindColorScale name="fuchsia" shades={TAILWIND_COLORS.fuchsia} />
                <TailwindColorScale name="pink" shades={TAILWIND_COLORS.pink} />
                <TailwindColorScale name="rose" shades={TAILWIND_COLORS.rose} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const Default = {
  render: () => <ColorsGallery />,
} satisfies Story;
