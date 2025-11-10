/**
 * Typography Token Stories
 *
 * Demonstrates Apollo Wind typography utilities including font families,
 * sizes, weights, and line heights from the Apollo Design System.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Reference/Tokens/Typography',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * Overview Story
 * Shows all typography utilities available in Apollo Wind
 */
export const Overview: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 text-foreground-emp mb-4">Typography System</h1>
          <p className="text-l text-foreground-de-emp mb-4">
            Apollo Wind provides typography utilities based on Apollo Design System tokens. All font
            sizes, weights, and line heights reference Apollo Core CSS variables for design system
            consistency.
          </p>
          <div className="bg-info border-l-4 border-info-600 p-4 rounded">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Note:</strong>
            </p>
            <p className="text-l text-foreground-de-emp">
              Typography utilities use Tailwind's standard naming with Apollo Design System values.
              Font families from apollo-core ensure consistency across all UiPath products.
            </p>
          </div>
        </div>

        {/* Font Families */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Font Families</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">Sans Serif (Default)</h3>
              <div className="bg-surface-raised p-6 rounded">
                <p className="font-sans text-2xl text-foreground mb-2">
                  The quick brown fox jumps over the lazy dog
                </p>
                <code className="text-sm text-primary">font-sans</code>
                <p className="text-sm text-foreground-de-emp mt-2">
                  noto-sans, "Noto Sans JP", -apple-system, BlinkMacSystemFont, system-ui,
                  sans-serif
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">Monospace</h3>
              <div className="bg-surface-raised p-6 rounded">
                <p className="font-mono text-2xl text-foreground mb-2">
                  The quick brown fox jumps over the lazy dog
                </p>
                <code className="text-sm text-primary">font-mono</code>
                <p className="text-sm text-foreground-de-emp mt-2">"Roboto Mono", monospace</p>
              </div>
            </div>

            <div className="bg-warning border-l-4 border-warning-600 p-4 rounded mt-6">
              <p className="text-l text-foreground-emp mb-2">
                <strong>Usage Note:</strong>
              </p>
              <p className="text-l text-foreground-de-emp">
                Sans serif is the default font family. Use{' '}
                <code className="text-primary">font-mono</code> for code snippets, terminal output,
                or data that requires fixed-width formatting.
              </p>
            </div>
          </div>
        </div>

        {/* Font Sizes */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Font Sizes</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Tailwind's complete font size scale, from extra small to 9xl.
          </p>

          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <p className="text-xs text-foreground mb-1">
                text-xs - Extra small text (0.75rem / 12px)
              </p>
              <code className="text-xs text-primary">text-xs</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-sm text-foreground mb-1">text-sm - Small text (0.875rem / 14px)</p>
              <code className="text-xs text-primary">text-sm</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-base text-foreground mb-1">text-base - Base text (1rem / 16px)</p>
              <code className="text-xs text-primary">text-base</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-lg text-foreground mb-1">text-lg - Large text (1.125rem / 18px)</p>
              <code className="text-xs text-primary">text-lg</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-xl text-foreground mb-1">
                text-xl - Extra large text (1.25rem / 20px)
              </p>
              <code className="text-xs text-primary">text-xl</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-2xl text-foreground mb-1">text-2xl - 2X large (1.5rem / 24px)</p>
              <code className="text-xs text-primary">text-2xl</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-3xl text-foreground mb-1">text-3xl - 3X large (1.875rem / 30px)</p>
              <code className="text-xs text-primary">text-3xl</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-4xl text-foreground mb-1">text-4xl - 4X large (2.25rem / 36px)</p>
              <code className="text-xs text-primary">text-4xl</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-5xl text-foreground mb-1">text-5xl - 5X large (3rem / 48px)</p>
              <code className="text-xs text-primary">text-5xl</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-6xl text-foreground mb-1">text-6xl</p>
              <code className="text-xs text-primary">text-6xl (3.75rem / 60px)</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-7xl text-foreground mb-1">text-7xl</p>
              <code className="text-xs text-primary">text-7xl (4.5rem / 72px)</code>
            </div>

            <div className="border-b border-border pb-4">
              <p className="text-8xl text-foreground mb-1">text-8xl</p>
              <code className="text-xs text-primary">text-8xl (6rem / 96px)</code>
            </div>

            <div className="pb-4">
              <p className="text-9xl text-foreground mb-1">text-9xl</p>
              <code className="text-xs text-primary">text-9xl (8rem / 128px)</code>
            </div>
          </div>
        </div>

        {/* Font Weights */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Font Weights</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Four font weight utilities for text emphasis.
          </p>

          <div className="space-y-6">
            <div>
              <p className="font-normal text-2xl text-foreground mb-2">Normal weight text (400)</p>
              <code className="text-sm text-primary">font-normal</code>
            </div>

            <div>
              <p className="font-medium text-2xl text-foreground mb-2">Medium weight text (500)</p>
              <code className="text-sm text-primary">font-medium</code>
            </div>

            <div>
              <p className="font-semibold text-2xl text-foreground mb-2">
                Semibold weight text (600)
              </p>
              <code className="text-sm text-primary">font-semibold</code>
            </div>

            <div>
              <p className="font-bold text-2xl text-foreground mb-2">Bold weight text (700)</p>
              <code className="text-sm text-primary">font-bold</code>
            </div>
          </div>

          <div className="bg-success border-l-4 border-success-600 p-4 rounded mt-6">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Recommended Usage:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-l text-foreground-de-emp">
              <li>
                <code className="text-primary">font-normal</code> - Body text
              </li>
              <li>
                <code className="text-primary">font-medium</code> - Subtle emphasis
              </li>
              <li>
                <code className="text-primary">font-semibold</code> - Headings, strong emphasis
              </li>
              <li>
                <code className="text-primary">font-bold</code> - Extra strong emphasis, titles
              </li>
            </ul>
          </div>
        </div>

        {/* Line Heights */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Line Heights</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Control vertical spacing between lines of text for optimal readability.
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-none</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-none text-xl text-foreground">
                  Line height: 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-tight</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-tight text-xl text-foreground">
                  Line height: 1.25. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-snug</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-snug text-xl text-foreground">
                  Line height: 1.375. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-normal</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-normal text-xl text-foreground">
                  Line height: 1.5 (Default). Lorem ipsum dolor sit amet, consectetur adipiscing
                  elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-relaxed</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-relaxed text-xl text-foreground">
                  Line height: 1.625. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">leading-loose</h3>
              <div className="bg-surface-raised p-4 rounded">
                <p className="leading-loose text-xl text-foreground">
                  Line height: 2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-info border-l-4 border-info-600 p-4 rounded mt-6">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Readability Guidelines:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-l text-foreground-de-emp">
              <li>
                <code className="text-primary">leading-tight</code> - Headings, compact displays
              </li>
              <li>
                <code className="text-primary">leading-normal</code> - Body text (default, 1.5
                ratio)
              </li>
              <li>
                <code className="text-primary">leading-relaxed</code> - Long-form content, improved
                readability
              </li>
            </ul>
          </div>
        </div>

        {/* Typography Combinations */}
        <div className="card card-elevated p-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Typography Combinations</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Combine size, weight, and line height utilities for effective typography hierarchy.
          </p>

          <div className="space-y-8">
            {/* Hero Text */}
            <div>
              <div className="bg-surface-raised p-6 rounded">
                <h1 className="text-5xl font-bold leading-tight text-foreground-emp mb-2">
                  Hero Heading
                </h1>
                <p className="text-xl font-normal leading-relaxed text-foreground-de-emp">
                  Supporting text for hero sections with comfortable line height
                </p>
              </div>
              <code className="text-sm text-primary mt-2 block">
                text-5xl font-bold leading-tight + text-xl leading-relaxed
              </code>
            </div>

            {/* Article Header */}
            <div>
              <div className="bg-surface-raised p-6 rounded">
                <h2 className="text-3xl font-semibold leading-snug text-foreground-emp mb-3">
                  Article Title
                </h2>
                <p className="text-base font-normal leading-normal text-foreground-de-emp">
                  Article introduction text with standard readability. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>
              <code className="text-sm text-primary mt-2 block">
                text-3xl font-semibold leading-snug + text-base leading-normal
              </code>
            </div>

            {/* Card Header */}
            <div>
              <div className="bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold leading-tight text-foreground-emp mb-2">
                  Card Title
                </h3>
                <p className="text-sm font-normal leading-normal text-foreground-de-emp">
                  Card description text with compact spacing
                </p>
              </div>
              <code className="text-sm text-primary mt-2 block">
                text-xl font-semibold leading-tight + text-sm leading-normal
              </code>
            </div>

            {/* Code Block */}
            <div>
              <div className="bg-surface-raised p-6 rounded">
                <pre className="font-mono text-sm leading-relaxed text-foreground bg-surface p-4 rounded overflow-x-auto">
                  {`function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`}
                </pre>
              </div>
              <code className="text-sm text-primary mt-2 block">
                font-mono text-sm leading-relaxed
              </code>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-8 bg-success border-l-4 border-success-600 p-6 rounded">
          <h3 className="text-h3 text-foreground-emp mb-4">Best Practices</h3>
          <ul className="space-y-3 text-l text-foreground-de-emp">
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use relative font sizes:</strong>
                <br />
                Prefer <code className="text-primary">text-base</code>,{' '}
                <code className="text-primary">text-lg</code> over fixed pixel values for responsive
                design.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Maintain hierarchy:</strong>
                <br />
                Use consistent size jumps (e.g., text-sm → text-base → text-lg → text-xl) for clear
                visual hierarchy.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">
                  Consider line height with font size:
                </strong>
                <br />
                Larger text needs tighter line height (
                <code className="text-primary">leading-tight</code>), body text needs comfortable
                spacing (<code className="text-primary">leading-normal</code>).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use monospace for code:</strong>
                <br />
                Always apply <code className="text-primary">font-mono</code> to code blocks,
                terminal output, and fixed-width data.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
