/**
 * Visual Token Stories - Shadows & Border Radius
 *
 * Demonstrates Apollo Wind visual utilities including shadows for elevation
 * and border radius for rounded corners.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Reference/Tokens/Visual Effects',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * Shadows Story
 * Shows all shadow utilities for elevation
 */
export const Shadows: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 text-foreground-emp mb-4">Shadow System</h1>
          <p className="text-l text-foreground-de-emp mb-4">
            Shadow utilities create elevation and depth using subtle shadows. Apollo Wind provides 6
            shadow levels from sm to 2xl.
          </p>
          <div className="bg-info border-l-4 border-info-600 p-4 rounded">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Design Principle:</strong>
            </p>
            <p className="text-l text-foreground-de-emp">
              Use shadows to establish visual hierarchy and indicate interactive elements. Stronger
              shadows suggest higher elevation and importance.
            </p>
          </div>
        </div>

        {/* Shadow Scale */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Shadow Scale</h2>
          <p className="text-l text-foreground-de-emp mb-8">
            Six levels of shadow elevation, from subtle (sm) to prominent (2xl).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* shadow-sm */}
            <div className="space-y-4">
              <div className="shadow-sm bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow-sm</h3>
                <p className="text-sm text-foreground-de-emp">Subtle shadow for slight elevation</p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Cards, list items</p>
              </div>
            </div>

            {/* shadow (default) */}
            <div className="space-y-4">
              <div className="shadow bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow</h3>
                <p className="text-sm text-foreground-de-emp">
                  Default shadow for standard elevation
                </p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Panels, modals</p>
              </div>
            </div>

            {/* shadow-md */}
            <div className="space-y-4">
              <div className="shadow-md bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow-md</h3>
                <p className="text-sm text-foreground-de-emp">
                  Medium shadow for moderate elevation
                </p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Dropdown menus, popovers</p>
              </div>
            </div>

            {/* shadow-lg */}
            <div className="space-y-4">
              <div className="shadow-lg bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow-lg</h3>
                <p className="text-sm text-foreground-de-emp">
                  Large shadow for prominent elevation
                </p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Modals, dialogs</p>
              </div>
            </div>

            {/* shadow-xl */}
            <div className="space-y-4">
              <div className="shadow-xl bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow-xl</h3>
                <p className="text-sm text-foreground-de-emp">
                  Extra large shadow for high elevation
                </p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Overlays, floating panels</p>
              </div>
            </div>

            {/* shadow-2xl */}
            <div className="space-y-4">
              <div className="shadow-2xl bg-surface-raised p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-2">shadow-2xl</h3>
                <p className="text-sm text-foreground-de-emp">
                  Maximum shadow for dramatic elevation
                </p>
              </div>
              <div className="bg-surface-raised p-3 rounded">
                <p className="text-xs text-foreground-de-emp">Use for:</p>
                <p className="text-sm text-foreground">Important alerts, focus states</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shadow Examples */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Practical Examples</h2>

          <div className="space-y-8">
            {/* Card Hierarchy */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Card Hierarchy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="shadow-sm bg-surface-raised p-6 rounded">
                  <h4 className="font-semibold text-foreground-emp mb-2">Basic Card</h4>
                  <p className="text-sm text-foreground-de-emp">shadow-sm for subtle elevation</p>
                </div>
                <div className="shadow-md bg-surface-raised p-6 rounded">
                  <h4 className="font-semibold text-foreground-emp mb-2">Featured Card</h4>
                  <p className="text-sm text-foreground-de-emp">shadow-md for prominence</p>
                </div>
                <div className="shadow-lg bg-surface-raised p-6 rounded">
                  <h4 className="font-semibold text-foreground-emp mb-2">Hero Card</h4>
                  <p className="text-sm text-foreground-de-emp">shadow-lg for maximum impact</p>
                </div>
              </div>
            </div>

            {/* Button Hover State */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Interactive Hover State</h3>
              <div className="flex gap-4">
                <button className="btn btn-primary-colors hover:shadow-lg transition-shadow">
                  Hover for shadow-lg
                </button>
                <button className="bg-primary text-primary-inverse px-6 py-3 rounded hover:shadow-xl transition-shadow">
                  Hover for shadow-xl
                </button>
              </div>
              <p className="text-sm text-foreground-de-emp mt-3">
                Shadows can enhance hover states to show interactivity.
              </p>
            </div>

            {/* Modal Example */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Modal/Dialog</h3>
              <div className="bg-surface-raised shadow-2xl max-w-md mx-auto p-6 rounded">
                <h3 className="text-xl font-semibold text-foreground-emp mb-4">Confirm Action</h3>
                <p className="text-foreground-de-emp mb-6">
                  This modal uses shadow-2xl to float above the page content.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-primary-colors">Confirm</button>
                  <button className="btn">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shadow Removal */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Shadow Control</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">shadow-none</h3>
              <p className="text-l text-foreground-de-emp mb-4">
                Remove shadows explicitly with <code className="text-primary">shadow-none</code>.
              </p>
              <div className="shadow-none bg-surface-raised border-2 border-border p-6 rounded">
                <p className="text-foreground">
                  This element has no shadow, using border instead for definition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-success border-l-4 border-success-600 p-6 rounded">
          <h3 className="text-h3 text-foreground-emp mb-4">Shadow Best Practices</h3>
          <ul className="space-y-3 text-l text-foreground-de-emp">
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use sparingly:</strong>
                <br />
                Too many shadows create visual noise. Reserve for elevation hierarchy.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Consistent elevation:</strong>
                <br />
                Use the same shadow level for similar UI elements (all cards use shadow-sm).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Combine with transitions:</strong>
                <br />
                Add <code className="text-primary">transition-shadow</code> for smooth hover
                effects.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-error font-bold">✗</span>
              <div>
                <strong className="text-foreground-emp">Avoid excessive elevation:</strong>
                <br />
                Don't use shadow-2xl everywhere - reserve it for truly important overlays.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

/**
 * Border Radius Story
 * Shows all border radius utilities
 */
export const BorderRadius: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 text-foreground-emp mb-4">Border Radius System</h1>
          <p className="text-l text-foreground-de-emp mb-4">
            Border radius utilities control corner rounding on elements. Apollo Wind provides 10
            levels from sharp corners to fully rounded.
          </p>
          <div className="bg-info border-l-4 border-info-600 p-4 rounded">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Apollo Default:</strong>
            </p>
            <p className="text-l text-foreground-de-emp">
              Apollo Design System uses <code className="text-primary">rounded</code> (4px /
              0.25rem) as the standard border radius. This creates subtle rounding without being
              overly rounded.
            </p>
          </div>
        </div>

        {/* Border Radius Scale */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Border Radius Scale</h2>
          <p className="text-l text-foreground-de-emp mb-8">
            Ten levels of border radius from none (0px) to full (9999px for circles).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* rounded-none */}
            <div className="space-y-3">
              <div className="rounded-none bg-primary text-primary-inverse p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-none</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">0px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Sharp corners</p>
              </div>
            </div>

            {/* rounded-sm */}
            <div className="space-y-3">
              <div className="rounded-sm bg-primary text-primary-inverse p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-sm</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">2px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Subtle rounding</p>
              </div>
            </div>

            {/* rounded (default) */}
            <div className="space-y-3">
              <div className="rounded bg-primary text-primary-inverse p-8 flex items-center justify-center border-4 border-success">
                <span className="text-lg font-semibold">rounded</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">4px</code>
                <p className="text-xs text-foreground-emp font-semibold mt-1">Apollo default ✓</p>
              </div>
            </div>

            {/* rounded-md */}
            <div className="space-y-3">
              <div className="rounded-md bg-blue-500 text-white p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-md</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">6px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Medium rounding</p>
              </div>
            </div>

            {/* rounded-lg */}
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-500 text-white p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-lg</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">8px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Large rounding</p>
              </div>
            </div>

            {/* rounded-xl */}
            <div className="space-y-3">
              <div className="rounded-xl bg-green-500 text-white p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-xl</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">12px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Extra large</p>
              </div>
            </div>

            {/* rounded-2xl */}
            <div className="space-y-3">
              <div className="rounded-2xl bg-green-500 text-white p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-2xl</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">16px</code>
                <p className="text-xs text-foreground-de-emp mt-1">2X large</p>
              </div>
            </div>

            {/* rounded-3xl */}
            <div className="space-y-3">
              <div className="rounded-3xl bg-purple-500 text-white p-8 flex items-center justify-center">
                <span className="text-lg font-semibold">rounded-3xl</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">24px</code>
                <p className="text-xs text-foreground-de-emp mt-1">3X large</p>
              </div>
            </div>

            {/* rounded-full */}
            <div className="space-y-3">
              <div className="rounded-full bg-purple-500 text-white w-32 h-32 flex items-center justify-center mx-auto">
                <span className="text-lg font-semibold">rounded-full</span>
              </div>
              <div className="text-center">
                <code className="text-sm text-primary">9999px</code>
                <p className="text-xs text-foreground-de-emp mt-1">Pill/circle shape</p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Corners */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Individual Corner Rounding</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Round specific corners independently for asymmetric designs.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="rounded-tl-2xl bg-orange-500 text-white p-8 flex items-center justify-center">
                TL
              </div>
              <code className="text-xs text-primary text-center block">rounded-tl-2xl</code>
            </div>

            <div className="space-y-3">
              <div className="rounded-tr-2xl bg-orange-500 text-white p-8 flex items-center justify-center">
                TR
              </div>
              <code className="text-xs text-primary text-center block">rounded-tr-2xl</code>
            </div>

            <div className="space-y-3">
              <div className="rounded-br-2xl bg-orange-500 text-white p-8 flex items-center justify-center">
                BR
              </div>
              <code className="text-xs text-primary text-center block">rounded-br-2xl</code>
            </div>

            <div className="space-y-3">
              <div className="rounded-bl-2xl bg-orange-500 text-white p-8 flex items-center justify-center">
                BL
              </div>
              <code className="text-xs text-primary text-center block">rounded-bl-2xl</code>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="rounded-t-2xl bg-blue-500 text-white p-8 flex items-center justify-center">
                Top
              </div>
              <code className="text-xs text-primary text-center block">rounded-t-2xl</code>
              <p className="text-xs text-foreground-de-emp text-center">Top-left & top-right</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-b-2xl bg-blue-500 text-white p-8 flex items-center justify-center">
                Bottom
              </div>
              <code className="text-xs text-primary text-center block">rounded-b-2xl</code>
              <p className="text-xs text-foreground-de-emp text-center">
                Bottom-left & bottom-right
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-l-2xl bg-green-500 text-white p-8 flex items-center justify-center">
                Left
              </div>
              <code className="text-xs text-primary text-center block">rounded-l-2xl</code>
              <p className="text-xs text-foreground-de-emp text-center">Top-left & bottom-left</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-r-2xl bg-green-500 text-white p-8 flex items-center justify-center">
                Right
              </div>
              <code className="text-xs text-primary text-center block">rounded-r-2xl</code>
              <p className="text-xs text-foreground-de-emp text-center">Top-right & bottom-right</p>
            </div>
          </div>
        </div>

        {/* Practical Examples */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Practical Examples</h2>

          <div className="space-y-8">
            {/* Avatar / Profile Picture */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Avatars & Profile Pictures</h3>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="rounded-full bg-primary text-primary-inverse w-20 h-20 flex items-center justify-center text-2xl font-bold">
                    JD
                  </div>
                  <p className="text-xs text-center mt-2 text-foreground-de-emp">rounded-full</p>
                </div>
                <div>
                  <div className="rounded-lg bg-primary text-primary-inverse w-20 h-20 flex items-center justify-center text-2xl font-bold">
                    JD
                  </div>
                  <p className="text-xs text-center mt-2 text-foreground-de-emp">rounded-lg</p>
                </div>
                <div>
                  <div className="rounded bg-primary text-primary-inverse w-20 h-20 flex items-center justify-center text-2xl font-bold">
                    JD
                  </div>
                  <p className="text-xs text-center mt-2 text-foreground-de-emp">rounded</p>
                </div>
              </div>
            </div>

            {/* Pill Buttons */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Pill-Shaped Buttons</h3>
              <div className="flex gap-3">
                <button className="bg-primary text-primary-inverse px-6 py-2 rounded-full">
                  Pill Button
                </button>
                <button className="bg-blue-500 text-white px-6 py-2 rounded-full">
                  Rounded Full
                </button>
              </div>
            </div>

            {/* Card with Top Image */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Card with Image</h3>
              <div className="card card-elevated max-w-sm overflow-hidden">
                <div className="bg-blue-500 text-white p-12 text-center">Image Area</div>
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-foreground-emp mb-2">Card Title</h4>
                  <p className="text-foreground-de-emp">
                    Card uses <code className="text-primary">rounded</code> with overflow-hidden to
                    clip the image.
                  </p>
                </div>
              </div>
            </div>

            {/* Badge/Chip */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Badges & Tags</h3>
              <div className="flex gap-3 flex-wrap">
                <span className="bg-success text-foreground-emp px-3 py-1 rounded-full text-sm">
                  New
                </span>
                <span className="bg-warning text-foreground-emp px-3 py-1 rounded-full text-sm">
                  Beta
                </span>
                <span className="bg-info text-foreground-emp px-3 py-1 rounded-full text-sm">
                  Popular
                </span>
                <span className="bg-primary text-primary-inverse px-3 py-1 rounded text-sm">
                  Featured
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-success border-l-4 border-success-600 p-6 rounded">
          <h3 className="text-h3 text-foreground-emp mb-4">Border Radius Best Practices</h3>
          <ul className="space-y-3 text-l text-foreground-de-emp">
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use Apollo default (rounded):</strong>
                <br />
                Prefer <code className="text-primary">rounded</code> (4px) for most UI elements to
                match Apollo Design System.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">rounded-full for pills:</strong>
                <br />
                Use <code className="text-primary">rounded-full</code> for badges, tags, avatar
                borders, and pill-shaped buttons.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Consistent rounding:</strong>
                <br />
                Apply the same border radius level to similar components for visual harmony.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-error font-bold">✗</span>
              <div>
                <strong className="text-foreground-emp">Avoid mixing radii randomly:</strong>
                <br />
                Don't use different radius levels without purpose - maintain consistency within
                component groups.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
