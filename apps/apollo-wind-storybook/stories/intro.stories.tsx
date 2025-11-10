import React from 'react';
import type { Meta } from '@storybook/react';

const version = '1.0.0'; // TODO: Import from package once JS exports are configured

const meta: Meta = {
  title: 'Introduction',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Welcome = () => (
  <div className="bg-surface min-h-screen">
    {/* Hero Section */}
    <div className="bg-primary text-primary-inverse p-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-h1 mb-2">Apollo Wind v{version}</h1>
        <p className="text-l opacity-90">
          Tailwind CSS theme implementation of the Apollo Design System
        </p>
      </div>
    </div>

    <div className="max-w-5xl mx-auto p-8">
      {/* What is Apollo Wind */}
      <div className="card card-elevated p-6 mb-8">
        <h2 className="text-h2 text-foreground-emp mb-4">What is Apollo Wind?</h2>
        <p className="text-l text-foreground-de-emp mb-4">
          Apollo Wind brings the Apollo Design System to Tailwind CSS projects at UiPath. It
          provides a complete Tailwind v4 theme that references apollo-core CSS variables, ensuring
          perfect design system compliance while giving you the power of Tailwind's utility-first
          approach.
        </p>

        <h3 className="text-h3 text-foreground-emp mb-3 mt-6">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-l">
          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">🎨 Design Tokens</h4>
            <p className="text-foreground-de-emp">
              All 564 Apollo color tokens automatically mapped to Tailwind utilities. Typography,
              spacing, shadows, and borders use Apollo specifications.
            </p>
          </div>

          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">🎯 Semantic Colors</h4>
            <p className="text-foreground-de-emp">
              117+ semantic utility classes (bg-surface, text-foreground-emp, etc.) that
              automatically adapt to theme changes.
            </p>
          </div>

          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">🧩 Component Utilities</h4>
            <p className="text-foreground-de-emp">
              17 pre-built component patterns (btn, card, input, chip, badge, etc.) following Apollo
              design specifications.
            </p>
          </div>

          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">🌓 Theme Support</h4>
            <p className="text-foreground-de-emp">
              Automatic light/dark/high-contrast theme switching via CSS variables. Works with
              existing apollo-angular-mdc-theme and apollo-mui5.
            </p>
          </div>

          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">⚡ CSS-First</h4>
            <p className="text-foreground-de-emp">
              Modern Tailwind v4 CSS-first distribution. No JavaScript required, better performance,
              smaller bundle sizes.
            </p>
          </div>

          <div>
            <h4 className="text-foreground-emp font-semibold mb-2">🔌 MFE Ready</h4>
            <p className="text-foreground-de-emp">
              Shadow DOM integration support for micro-frontends and web components. Perfect for
              UiPath's modular architecture.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="card p-6 mb-8">
        <h2 className="text-h2 text-foreground-emp mb-4">Quick Start</h2>

        <div className="mb-6">
          <h3 className="text-h3 text-foreground-emp mb-3">Installation</h3>
          <pre className="bg-surface-raised text-foreground p-4 rounded text-sm overflow-x-auto">
            {`yarn add @uipath/apollo-wind tailwindcss @tailwindcss/postcss postcss`}
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="text-h3 text-foreground-emp mb-3">PostCSS Configuration</h3>
          <pre className="bg-surface-raised text-foreground p-4 rounded text-sm overflow-x-auto">
            {`// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};`}
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="text-h3 text-foreground-emp mb-3">Import in Your CSS</h3>
          <pre className="bg-surface-raised text-foreground p-4 rounded text-sm overflow-x-auto">
            {`/* src/main.css */
@import "tailwindcss";
@import "@uipath/apollo-wind";`}
          </pre>
          <p className="text-s text-foreground-de-emp mt-2">
            <strong>Note:</strong> If your app already uses apollo-angular-mdc-theme or apollo-mui5,
            you're done! Those packages provide theme switching CSS. For standalone apps, import
            <code className="text-primary"> @uipath/apollo-wind/theme-selectors</code> first.
          </p>
        </div>

        <div>
          <h3 className="text-h3 text-foreground-emp mb-3">Use Apollo Wind Utilities</h3>
          <pre className="bg-surface-raised text-foreground p-4 rounded text-sm overflow-x-auto">
            {`<button class="btn btn-primary-colors">
  Click Me
</button>

<div class="card card-elevated p-6">
  <h2 class="text-h3 text-foreground-emp">Card Title</h2>
  <p class="text-l text-foreground-de-emp">Card content...</p>
</div>`}
          </pre>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="card p-6 mb-8">
        <h2 className="text-h2 text-foreground-emp mb-4">Architecture</h2>
        <p className="text-l text-foreground-de-emp mb-4">
          Apollo Wind uses Tailwind v4's <code className="text-primary">@theme inline</code>{' '}
          directive to reference apollo-core CSS variables directly. This means:
        </p>

        <div className="bg-surface-raised p-4 rounded mb-4">
          <ul className="space-y-3 text-l">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">1.</span>
              <div>
                <span className="text-foreground-emp font-semibold">No Token Duplication:</span>
                <span className="text-foreground-de-emp">
                  {' '}
                  Apollo Wind doesn't copy token values. It references apollo-core CSS variables,
                  ensuring single source of truth.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">2.</span>
              <div>
                <span className="text-foreground-emp font-semibold">Automatic Theme Updates:</span>
                <span className="text-foreground-de-emp">
                  {' '}
                  When apollo-core updates, your Tailwind utilities automatically get the new
                  values.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">3.</span>
              <div>
                <span className="text-foreground-emp font-semibold">Theme Switching Works:</span>
                <span className="text-foreground-de-emp">
                  {' '}
                  CSS variables update when body classes change (body.light, body.dark, etc.), so
                  all Tailwind utilities adapt automatically.
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-info p-4 rounded border-l-4 border-info-600">
          <p className="text-l text-foreground-emp mb-2">
            <strong>Example: How text-primary Works</strong>
          </p>
          <div className="space-y-2 text-sm">
            <div className="text-foreground-de-emp">
              1. You write: <code className="text-primary">text-primary</code>
            </div>
            <div className="text-foreground-de-emp">
              2. Tailwind generates:{' '}
              <code className="text-primary">color: var(--color-primary-500)</code>
            </div>
            <div className="text-foreground-de-emp">
              3. Apollo Core defines:{' '}
              <code className="text-primary">--color-primary-500: #0067df</code> (light) /{' '}
              <code className="text-primary">#42a1ff</code> (dark)
            </div>
            <div className="text-foreground-de-emp">
              4. Result: Your text color automatically changes with the theme!
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="card p-6 mb-8">
        <h2 className="text-h2 text-foreground-emp mb-4">Documentation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-h3 text-foreground-emp mb-3">📚 Getting Started</h3>
            <ul className="space-y-2 text-l">
              <li>
                <a href="#" className="text-primary hover:underline">
                  PostCSS Configuration Guide
                </a>
                <p className="text-s text-foreground-de-emp">
                  Framework integration (Vite, Next.js, Angular, Webpack)
                </p>
              </li>
              <li>
                <a href="#" className="text-primary hover:underline">
                  Tailwind v3 → v4 Migration
                </a>
                <p className="text-s text-foreground-de-emp">
                  Complete migration walkthrough (467 lines)
                </p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-h3 text-foreground-emp mb-3">🔧 Advanced Topics</h3>
            <ul className="space-y-2 text-l">
              <li>
                <a href="#" className="text-primary hover:underline">
                  Shadow DOM Integration
                </a>
                <p className="text-s text-foreground-de-emp">
                  MFE and Web Components support (545 lines)
                </p>
              </li>
              <li>
                <a href="#" className="text-primary hover:underline">
                  CI/CD Integration
                </a>
                <p className="text-s text-foreground-de-emp">Build, test, and publish workflows</p>
              </li>
              <li>
                <a href="#" className="text-primary hover:underline">
                  Performance & Bundle Size
                </a>
                <p className="text-s text-foreground-de-emp">
                  Optimization strategies (18KB gzipped)
                </p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-h3 text-foreground-emp mb-3">📖 Reference</h3>
            <ul className="space-y-2 text-l">
              <li>
                <a href="#" className="text-primary hover:underline">
                  API Reference
                </a>
                <p className="text-s text-foreground-de-emp">
                  All 117 semantic colors + 17 components (1000+ lines)
                </p>
              </li>
              <li>
                <a href="#" className="text-primary hover:underline">
                  Build Process
                </a>
                <p className="text-s text-foreground-de-emp">
                  Detailed build pipeline documentation
                </p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-h3 text-foreground-emp mb-3">🎨 Examples</h3>
            <ul className="space-y-2 text-l">
              <li>
                <a
                  href="?path=/story/tutorial-building-a-registration-form--story-1-preview"
                  className="text-primary hover:underline"
                >
                  Tutorial: Building a Form
                </a>
                <p className="text-s text-foreground-de-emp">
                  Step-by-step guide with explanations
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bundle Size */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-foreground-de-emp text-s mb-1">Main CSS Bundle</div>
          <div className="text-h3 text-foreground-emp">18.01 KB</div>
          <div className="text-foreground-de-emp text-s">gzipped (138 KB minified)</div>
        </div>

        <div className="card p-4">
          <div className="text-foreground-de-emp text-s mb-1">Theme Selectors</div>
          <div className="text-h3 text-foreground-emp">2.25 KB</div>
          <div className="text-foreground-de-emp text-s">gzipped (21 KB minified)</div>
        </div>

        <div className="card p-4">
          <div className="text-foreground-de-emp text-s mb-1">Total Coverage</div>
          <div className="text-h3 text-foreground-emp">100%</div>
          <div className="text-foreground-de-emp text-s">302 tests passing</div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-primary text-primary-inverse p-6 rounded">
        <h2 className="text-h2 mb-3">Ready to Get Started?</h2>
        <p className="text-l opacity-90 mb-4">
          Explore the Tutorial story to see Apollo Wind in action, or dive into the comprehensive
          documentation to integrate with your project.
        </p>
        <div className="flex gap-3">
          <a
            href="?path=/story/tutorial-building-a-registration-form--story-1-preview"
            className="btn bg-primary-inverse text-primary hover:opacity-90 transition-opacity"
          >
            Start Tutorial
          </a>
          <a
            href="https://github.com/UiPath/apollo-design-system/tree/master/packages/apollo-wind"
            className="btn border-2 border-primary-inverse text-primary-inverse hover:bg-primary-inverse/10 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  </div>
);

Welcome.storyName = 'Welcome to Apollo Wind';
