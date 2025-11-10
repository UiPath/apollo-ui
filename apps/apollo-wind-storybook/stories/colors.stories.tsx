/**
 * Color System Stories
 *
 * Demonstrates all Apollo Wind color utilities from the Apollo Design System.
 * These stories showcase the 564 color tokens mapped to Tailwind utilities.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Reference/Tokens/Colors',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * Color Swatch Component
 * Displays a color swatch with its utility class name and CSS variable
 */
const ColorSwatch = ({
  className,
  label,
  cssVar,
  contrast = false,
}: {
  className: string;
  label: string;
  cssVar: string;
  contrast?: boolean;
}) => (
  <div className="flex flex-col">
    <div
      className={`${className} ${contrast ? 'text-white' : 'text-foreground'} h-24 rounded flex items-center justify-center font-semibold text-sm shadow-sm`}
    >
      {label}
    </div>
    <div className="mt-2 text-xs">
      <code className="text-primary">{cssVar}</code>
    </div>
  </div>
);

/**
 * Palette Section Component
 * Displays a complete color palette with all shades
 */
const PaletteSection = ({
  title,
  description,
  colors,
}: {
  title: string;
  description: string;
  colors: Array<{ shade: string; className: string; cssVar: string; contrast?: boolean }>;
}) => (
  <div className="mb-12">
    <h2 className="text-h2 text-foreground-emp mb-2">{title}</h2>
    <p className="text-l text-foreground-de-emp mb-6">{description}</p>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {colors.map((color) => (
        <ColorSwatch
          key={color.shade}
          className={color.className}
          label={color.shade}
          cssVar={color.cssVar}
          contrast={color.contrast}
        />
      ))}
    </div>
  </div>
);

/**
 * Overview Story
 * Shows all color palettes from the Apollo Design System
 */
export const Overview: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 text-foreground-emp mb-4">Apollo Color System</h1>
          <p className="text-l text-foreground-de-emp mb-4">
            All 564 color tokens from the Apollo Design System, automatically mapped to Tailwind
            utilities. Every color references a CSS variable, ensuring theme switching works
            automatically.
          </p>
          <div className="bg-info border-l-4 border-info-600 p-4 rounded">
            <p className="text-l text-foreground-emp mb-2">
              <strong>How It Works:</strong>
            </p>
            <p className="text-l text-foreground-de-emp">
              Apollo Wind uses Tailwind v4's <code className="text-primary">@theme inline</code>{' '}
              directive to reference apollo-core CSS variables. When you write{' '}
              <code className="text-primary">bg-orange-500</code>, Tailwind generates{' '}
              <code className="text-primary">background: var(--color-orange-500)</code>. The actual
              color value comes from apollo-core and changes with the active theme.
            </p>
          </div>
        </div>

        {/* Orange Palette */}
        <PaletteSection
          title="Orange Palette"
          description="Primary brand color palette. Orange-500 is the core brand color used throughout UiPath products."
          colors={[
            { shade: '100', className: 'bg-orange-100', cssVar: '--color-orange-100' },
            { shade: '200', className: 'bg-orange-200', cssVar: '--color-orange-200' },
            { shade: '300', className: 'bg-orange-300', cssVar: '--color-orange-300' },
            {
              shade: '400',
              className: 'bg-orange-400',
              cssVar: '--color-orange-400',
              contrast: true,
            },
            {
              shade: '500',
              className: 'bg-orange-500',
              cssVar: '--color-orange-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-orange-600',
              cssVar: '--color-orange-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-orange-700',
              cssVar: '--color-orange-700',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-orange-800',
              cssVar: '--color-orange-800',
              contrast: true,
            },
            {
              shade: '850',
              className: 'bg-orange-850',
              cssVar: '--color-orange-850',
              contrast: true,
            },
          ]}
        />

        {/* Blue Palette */}
        <PaletteSection
          title="Blue Palette"
          description="Primary blue palette used for interactive elements, links, and informational UI."
          colors={[
            { shade: '050', className: 'bg-blue-050', cssVar: '--color-blue-050' },
            { shade: '100', className: 'bg-blue-100', cssVar: '--color-blue-100' },
            { shade: '200', className: 'bg-blue-200', cssVar: '--color-blue-200' },
            { shade: '300', className: 'bg-blue-300', cssVar: '--color-blue-300' },
            { shade: '400', className: 'bg-blue-400', cssVar: '--color-blue-400', contrast: true },
            { shade: '500', className: 'bg-blue-500', cssVar: '--color-blue-500', contrast: true },
            { shade: '600', className: 'bg-blue-600', cssVar: '--color-blue-600', contrast: true },
            { shade: '700', className: 'bg-blue-700', cssVar: '--color-blue-700', contrast: true },
            { shade: '800', className: 'bg-blue-800', cssVar: '--color-blue-800', contrast: true },
          ]}
        />

        {/* Blue Secondary Palette */}
        <PaletteSection
          title="Blue Secondary Palette"
          description="Secondary blue palette for additional blue variations and accent colors."
          colors={[
            {
              shade: '100',
              className: 'bg-blue-secondary-100',
              cssVar: '--color-blue-secondary-100',
            },
            {
              shade: '200',
              className: 'bg-blue-secondary-200',
              cssVar: '--color-blue-secondary-200',
            },
            {
              shade: '300',
              className: 'bg-blue-secondary-300',
              cssVar: '--color-blue-secondary-300',
            },
            {
              shade: '400',
              className: 'bg-blue-secondary-400',
              cssVar: '--color-blue-secondary-400',
              contrast: true,
            },
            {
              shade: '500',
              className: 'bg-blue-secondary-500',
              cssVar: '--color-blue-secondary-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-blue-secondary-600',
              cssVar: '--color-blue-secondary-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-blue-secondary-700',
              cssVar: '--color-blue-secondary-700',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-blue-secondary-800',
              cssVar: '--color-blue-secondary-800',
              contrast: true,
            },
          ]}
        />

        {/* Green Palette */}
        <PaletteSection
          title="Green Palette"
          description="Success and positive status colors. Used for confirmations, completions, and successful operations."
          colors={[
            { shade: '050', className: 'bg-green-050', cssVar: '--color-green-050' },
            { shade: '100', className: 'bg-green-100', cssVar: '--color-green-100' },
            { shade: '200', className: 'bg-green-200', cssVar: '--color-green-200' },
            { shade: '250', className: 'bg-green-250', cssVar: '--color-green-250' },
            { shade: '300', className: 'bg-green-300', cssVar: '--color-green-300' },
            { shade: '400', className: 'bg-green-400', cssVar: '--color-green-400' },
            {
              shade: '500',
              className: 'bg-green-500',
              cssVar: '--color-green-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-green-600',
              cssVar: '--color-green-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-green-700',
              cssVar: '--color-green-700',
              contrast: true,
            },
            {
              shade: '750',
              className: 'bg-green-750',
              cssVar: '--color-green-750',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-green-800',
              cssVar: '--color-green-800',
              contrast: true,
            },
          ]}
        />

        {/* Yellow Palette */}
        <PaletteSection
          title="Yellow Palette"
          description="Warning and cautionary colors. Used for alerts, warnings, and attention-grabbing elements."
          colors={[
            { shade: '100', className: 'bg-yellow-100', cssVar: '--color-yellow-100' },
            { shade: '200', className: 'bg-yellow-200', cssVar: '--color-yellow-200' },
            { shade: '300', className: 'bg-yellow-300', cssVar: '--color-yellow-300' },
            { shade: '400', className: 'bg-yellow-400', cssVar: '--color-yellow-400' },
            { shade: '500', className: 'bg-yellow-500', cssVar: '--color-yellow-500' },
            {
              shade: '600',
              className: 'bg-yellow-600',
              cssVar: '--color-yellow-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-yellow-700',
              cssVar: '--color-yellow-700',
              contrast: true,
            },
            {
              shade: '750',
              className: 'bg-yellow-750',
              cssVar: '--color-yellow-750',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-yellow-800',
              cssVar: '--color-yellow-800',
              contrast: true,
            },
          ]}
        />

        {/* Red Palette */}
        <PaletteSection
          title="Red Palette"
          description="Error and destructive action colors. Used for errors, deletions, and critical warnings."
          colors={[
            { shade: '100', className: 'bg-red-100', cssVar: '--color-red-100' },
            { shade: '200', className: 'bg-red-200', cssVar: '--color-red-200' },
            { shade: '300', className: 'bg-red-300', cssVar: '--color-red-300' },
            { shade: '400', className: 'bg-red-400', cssVar: '--color-red-400', contrast: true },
            { shade: '500', className: 'bg-red-500', cssVar: '--color-red-500', contrast: true },
            { shade: '600', className: 'bg-red-600', cssVar: '--color-red-600', contrast: true },
            { shade: '700', className: 'bg-red-700', cssVar: '--color-red-700', contrast: true },
            { shade: '800', className: 'bg-red-800', cssVar: '--color-red-800', contrast: true },
          ]}
        />

        {/* Purple Palette */}
        <PaletteSection
          title="Purple Palette"
          description="Accent color for special features, highlights, and decorative elements."
          colors={[
            { shade: '100', className: 'bg-purple-100', cssVar: '--color-purple-100' },
            { shade: '200', className: 'bg-purple-200', cssVar: '--color-purple-200' },
            { shade: '300', className: 'bg-purple-300', cssVar: '--color-purple-300' },
            {
              shade: '400',
              className: 'bg-purple-400',
              cssVar: '--color-purple-400',
              contrast: true,
            },
            {
              shade: '500',
              className: 'bg-purple-500',
              cssVar: '--color-purple-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-purple-600',
              cssVar: '--color-purple-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-purple-700',
              cssVar: '--color-purple-700',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-purple-800',
              cssVar: '--color-purple-800',
              contrast: true,
            },
          ]}
        />

        {/* Light Blue Palette */}
        <PaletteSection
          title="Light Blue Palette"
          description="Lighter blue variations for backgrounds, hover states, and secondary UI elements."
          colors={[
            { shade: '100', className: 'bg-light-blue-100', cssVar: '--color-light-blue-100' },
            { shade: '200', className: 'bg-light-blue-200', cssVar: '--color-light-blue-200' },
            { shade: '300', className: 'bg-light-blue-300', cssVar: '--color-light-blue-300' },
            { shade: '400', className: 'bg-light-blue-400', cssVar: '--color-light-blue-400' },
            {
              shade: '500',
              className: 'bg-light-blue-500',
              cssVar: '--color-light-blue-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-light-blue-600',
              cssVar: '--color-light-blue-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-light-blue-700',
              cssVar: '--color-light-blue-700',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-light-blue-800',
              cssVar: '--color-light-blue-800',
              contrast: true,
            },
          ]}
        />

        {/* Neutral Palette */}
        <PaletteSection
          title="Neutral Palette"
          description="Neutral grays for backgrounds, borders, dividers, and text. The foundation of Apollo's color system."
          colors={[
            { shade: '050', className: 'bg-neutral-050', cssVar: '--color-neutral-050' },
            { shade: '100', className: 'bg-neutral-100', cssVar: '--color-neutral-100' },
            { shade: '200', className: 'bg-neutral-200', cssVar: '--color-neutral-200' },
            { shade: '300', className: 'bg-neutral-300', cssVar: '--color-neutral-300' },
            { shade: '400', className: 'bg-neutral-400', cssVar: '--color-neutral-400' },
            {
              shade: '500',
              className: 'bg-neutral-500',
              cssVar: '--color-neutral-500',
              contrast: true,
            },
            {
              shade: '600',
              className: 'bg-neutral-600',
              cssVar: '--color-neutral-600',
              contrast: true,
            },
            {
              shade: '700',
              className: 'bg-neutral-700',
              cssVar: '--color-neutral-700',
              contrast: true,
            },
            {
              shade: '800',
              className: 'bg-neutral-800',
              cssVar: '--color-neutral-800',
              contrast: true,
            },
            {
              shade: '900',
              className: 'bg-neutral-900',
              cssVar: '--color-neutral-900',
              contrast: true,
            },
            {
              shade: '950',
              className: 'bg-neutral-950',
              cssVar: '--color-neutral-950',
              contrast: true,
            },
          ]}
        />

        {/* Pink Palette */}
        <PaletteSection
          title="Pink Palette"
          description="Accent color for decorative elements and special UI treatments."
          colors={[
            { shade: '100', className: 'bg-pink-100', cssVar: '--color-pink-100' },
            { shade: '200', className: 'bg-pink-200', cssVar: '--color-pink-200' },
            { shade: '300', className: 'bg-pink-300', cssVar: '--color-pink-300' },
            { shade: '400', className: 'bg-pink-400', cssVar: '--color-pink-400', contrast: true },
            { shade: '500', className: 'bg-pink-500', cssVar: '--color-pink-500', contrast: true },
            { shade: '600', className: 'bg-pink-600', cssVar: '--color-pink-600', contrast: true },
            { shade: '700', className: 'bg-pink-700', cssVar: '--color-pink-700', contrast: true },
            { shade: '800', className: 'bg-pink-800', cssVar: '--color-pink-800', contrast: true },
          ]}
        />

        {/* Usage Examples */}
        <div className="mt-16 card card-elevated p-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Usage Examples</h2>

          <div className="space-y-8">
            {/* Background Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Background Colors</h3>
              <div className="flex flex-wrap gap-4">
                <div className="bg-orange-500 text-white p-6 rounded">
                  <code>bg-orange-500</code>
                </div>
                <div className="bg-blue-500 text-white p-6 rounded">
                  <code>bg-blue-500</code>
                </div>
                <div className="bg-green-500 text-white p-6 rounded">
                  <code>bg-green-500</code>
                </div>
                <div className="bg-purple-500 text-white p-6 rounded">
                  <code>bg-purple-500</code>
                </div>
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Text Colors</h3>
              <div className="space-y-2 text-l">
                <p className="text-orange-500">text-orange-500 - Primary brand text</p>
                <p className="text-blue-600">text-blue-600 - Link text</p>
                <p className="text-green-600">text-green-600 - Success text</p>
                <p className="text-red-600">text-red-600 - Error text</p>
                <p className="text-yellow-700">text-yellow-700 - Warning text</p>
              </div>
            </div>

            {/* Border Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Border Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-4 border-orange-500 p-4 rounded">
                  <code className="text-sm">border-orange-500</code>
                </div>
                <div className="border-4 border-blue-500 p-4 rounded">
                  <code className="text-sm">border-blue-500</code>
                </div>
                <div className="border-4 border-green-500 p-4 rounded">
                  <code className="text-sm">border-green-500</code>
                </div>
                <div className="border-4 border-red-500 p-4 rounded">
                  <code className="text-sm">border-red-500</code>
                </div>
              </div>
            </div>

            {/* Gradient Examples */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Combining Colors</h3>
              <div className="space-y-4">
                <div className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded cursor-pointer transition-colors">
                  <code>bg-orange-500 hover:bg-orange-600</code>
                  <p className="text-sm mt-2 opacity-90">Hover to see color change</p>
                </div>
                <div className="bg-blue-050 border-2 border-blue-500 text-blue-700 p-6 rounded">
                  <code>bg-blue-050 border-blue-500 text-blue-700</code>
                  <p className="text-sm mt-2">Subtle blue combination</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-8 bg-info border-l-4 border-info-600 p-6 rounded">
          <h3 className="text-h3 text-foreground-emp mb-4">Best Practices</h3>
          <ul className="space-y-3 text-l text-foreground-de-emp">
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">
                  Use semantic colors for theme support:
                </strong>
                <br />
                Prefer <code className="text-primary">bg-surface</code>,{' '}
                <code className="text-primary">text-foreground</code> over base palette colors for
                main UI.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use palette colors for accents:</strong>
                <br />
                Use <code className="text-primary">bg-orange-500</code>,{' '}
                <code className="text-primary">text-blue-600</code> for brand-specific elements.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Contrast variants available:</strong>
                <br />
                Use <code className="text-primary">*-contrast</code> variants for accessible text on
                colored backgrounds.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-error font-bold">✗</span>
              <div>
                <strong className="text-foreground-emp">Avoid hard-coded hex values:</strong>
                <br />
                Don't use arbitrary values like <code className="text-error">bg-[#ff6a13]</code> -
                use Apollo tokens instead.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

/**
 * Semantic Colors Story
 * Shows theme-aware semantic color utilities
 */
export const SemanticColors: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-h1 text-foreground-emp mb-4">Semantic Color Utilities</h1>
        <p className="text-l text-foreground-de-emp mb-8">
          In addition to base palette colors, Apollo Wind provides 117+ semantic color utilities
          that automatically adapt to the active theme. These should be your primary choice for
          building theme-aware UIs.
        </p>

        <div className="bg-warning border-l-4 border-warning-600 p-6 rounded mb-8">
          <p className="text-l text-foreground-emp mb-2">
            <strong>Theme Switching:</strong>
          </p>
          <p className="text-l text-foreground-de-emp">
            Semantic colors change automatically when you switch themes (light, dark,
            high-contrast). Base palette colors (orange-500, blue-600, etc.) remain constant across
            themes.
          </p>
        </div>

        <div className="card card-elevated p-6">
          <h2 className="text-h2 text-foreground-emp mb-6">Common Semantic Colors</h2>

          <div className="space-y-8">
            {/* Surface Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Surface Colors</h3>
              <div className="space-y-3">
                <div className="bg-surface p-4 rounded border border-border">
                  <code>bg-surface</code> - Main surface background
                </div>
                <div className="bg-surface-raised p-4 rounded">
                  <code>bg-surface-raised</code> - Elevated surface
                </div>
                <div className="bg-background p-4 rounded border border-border">
                  <code>bg-background</code> - Page background
                </div>
                <div className="bg-background-hover p-4 rounded">
                  <code>bg-background-hover</code> - Hover state background
                </div>
              </div>
            </div>

            {/* Foreground Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Foreground Colors</h3>
              <div className="space-y-3 text-l">
                <p className="text-foreground-emp">
                  <code>text-foreground-emp</code> - Emphasized text
                </p>
                <p className="text-foreground">
                  <code>text-foreground</code> - Default text
                </p>
                <p className="text-foreground-de-emp">
                  <code>text-foreground-de-emp</code> - De-emphasized text
                </p>
              </div>
            </div>

            {/* Status Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Status Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-success p-4 rounded">
                  <code className="text-foreground-emp">bg-success</code>
                  <p className="text-foreground-de-emp text-sm mt-1">Success background</p>
                </div>
                <div className="bg-error p-4 rounded">
                  <code className="text-foreground-emp">bg-error</code>
                  <p className="text-foreground-de-emp text-sm mt-1">Error background</p>
                </div>
                <div className="bg-warning p-4 rounded">
                  <code className="text-foreground-emp">bg-warning</code>
                  <p className="text-foreground-de-emp text-sm mt-1">Warning background</p>
                </div>
                <div className="bg-info p-4 rounded">
                  <code className="text-foreground-emp">bg-info</code>
                  <p className="text-foreground-de-emp text-sm mt-1">Info background</p>
                </div>
              </div>
            </div>

            {/* Primary Colors */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Primary Colors</h3>
              <div className="space-y-3">
                <div className="bg-primary text-primary-inverse p-4 rounded">
                  <code>bg-primary text-primary-inverse</code>
                </div>
                <div className="bg-primary-hover text-primary-inverse p-4 rounded">
                  <code>bg-primary-hover text-primary-inverse</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-l text-foreground-de-emp">
          <p>
            For the complete list of 117+ semantic utilities, see the{' '}
            <a href="?path=/docs/tokens-colors--overview" className="text-primary hover:underline">
              API Reference
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * CSS Variable Inspection Story
 * Helps developers verify CSS variable references
 */
export const CSSVariableInspection: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-h1 text-foreground-emp mb-4">CSS Variable Inspection</h1>
        <p className="text-l text-foreground-de-emp mb-8">
          Open your browser's DevTools and inspect the elements below to verify they use CSS
          variables (<code className="text-primary">var(--color-*)</code>) instead of hard-coded
          color values.
        </p>

        <div className="card card-elevated p-6 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Test Elements</h2>

          <div className="space-y-6">
            <div className="bg-orange-500 text-white p-6 rounded">
              <h3 className="text-xl font-bold mb-2">Inspect This Element</h3>
              <p className="mb-4">
                This element uses{' '}
                <code className="bg-orange-600 px-2 py-1 rounded">bg-orange-500</code>
              </p>
              <div className="bg-surface-raised text-foreground p-4 rounded">
                <strong>Expected CSS:</strong>
                <pre className="mt-2 text-sm">background-color: var(--color-orange-500);</pre>
              </div>
            </div>

            <div className="border-4 border-blue-500 p-6 rounded">
              <h3 className="text-xl font-bold mb-2 text-foreground-emp">Border Color Test</h3>
              <p className="text-foreground-de-emp mb-4">
                This element uses <code className="text-primary">border-blue-500</code>
              </p>
              <div className="bg-surface-raised text-foreground p-4 rounded">
                <strong>Expected CSS:</strong>
                <pre className="mt-2 text-sm">border-color: var(--color-blue-500);</pre>
              </div>
            </div>

            <div className="p-6 rounded" style={{ backgroundColor: 'var(--color-green-500)' }}>
              <h3 className="text-xl font-bold mb-2 text-white">Direct CSS Variable</h3>
              <p className="text-white mb-4">
                This element uses inline style with{' '}
                <code className="bg-green-600 px-2 py-1 rounded">var(--color-green-500)</code>
              </p>
              <div className="bg-surface-raised text-foreground p-4 rounded">
                <strong>Expected CSS:</strong>
                <pre className="mt-2 text-sm">background-color: var(--color-green-500);</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-h2 text-foreground-emp mb-4">Verification Steps</h2>
          <ol className="list-decimal list-inside space-y-3 text-l text-foreground-de-emp">
            <li>Open browser DevTools (F12 or right-click → Inspect)</li>
            <li>Select any colored element above using the element picker</li>
            <li>Look at the Styles or Computed panel</li>
            <li>
              Verify the CSS uses <code className="text-primary">var(--color-*)</code> syntax
            </li>
            <li>Expand the CSS variable to see its resolved value from apollo-core</li>
          </ol>
        </div>
      </div>
    </div>
  ),
};
