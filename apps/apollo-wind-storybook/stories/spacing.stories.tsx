/**
 * Spacing Token Stories
 *
 * Demonstrates Apollo Wind spacing utilities including padding, margin,
 * gap, and space-between utilities using Tailwind's spacing scale.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Reference/Tokens/Spacing',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * Overview Story
 * Shows all spacing utilities and the spacing scale
 */
export const Overview: StoryObj = {
  render: () => (
    <div className="bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 text-foreground-emp mb-4">Spacing System</h1>
          <p className="text-l text-foreground-de-emp mb-4">
            Apollo Wind uses Tailwind's spacing scale (0.25rem / 4px increments) for consistent
            spacing across padding, margin, gap, and other layout utilities.
          </p>
          <div className="bg-info border-l-4 border-info-600 p-4 rounded">
            <p className="text-l text-foreground-emp mb-2">
              <strong>Spacing Scale:</strong>
            </p>
            <p className="text-l text-foreground-de-emp">
              Each spacing unit represents 0.25rem (4px). For example,{' '}
              <code className="text-primary">p-4</code> = 1rem (16px),
              <code className="text-primary">m-8</code> = 2rem (32px). This provides a consistent,
              predictable spacing system across all UiPath products.
            </p>
          </div>
        </div>

        {/* Spacing Scale Reference */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Spacing Scale Reference</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Complete spacing scale from 0 to 96 (0px to 384px).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { size: '0', rem: '0', px: '0px' },
              { size: '0.5', rem: '0.125rem', px: '2px' },
              { size: '1', rem: '0.25rem', px: '4px' },
              { size: '1.5', rem: '0.375rem', px: '6px' },
              { size: '2', rem: '0.5rem', px: '8px' },
              { size: '2.5', rem: '0.625rem', px: '10px' },
              { size: '3', rem: '0.75rem', px: '12px' },
              { size: '3.5', rem: '0.875rem', px: '14px' },
              { size: '4', rem: '1rem', px: '16px' },
              { size: '5', rem: '1.25rem', px: '20px' },
              { size: '6', rem: '1.5rem', px: '24px' },
              { size: '7', rem: '1.75rem', px: '28px' },
              { size: '8', rem: '2rem', px: '32px' },
              { size: '9', rem: '2.25rem', px: '36px' },
              { size: '10', rem: '2.5rem', px: '40px' },
              { size: '11', rem: '2.75rem', px: '44px' },
              { size: '12', rem: '3rem', px: '48px' },
              { size: '14', rem: '3.5rem', px: '56px' },
              { size: '16', rem: '4rem', px: '64px' },
              { size: '20', rem: '5rem', px: '80px' },
              { size: '24', rem: '6rem', px: '96px' },
              { size: '28', rem: '7rem', px: '112px' },
              { size: '32', rem: '8rem', px: '128px' },
              { size: '36', rem: '9rem', px: '144px' },
              { size: '40', rem: '10rem', px: '160px' },
              { size: '44', rem: '11rem', px: '176px' },
              { size: '48', rem: '12rem', px: '192px' },
              { size: '52', rem: '13rem', px: '208px' },
              { size: '56', rem: '14rem', px: '224px' },
              { size: '60', rem: '15rem', px: '240px' },
              { size: '64', rem: '16rem', px: '256px' },
              { size: '72', rem: '18rem', px: '288px' },
              { size: '80', rem: '20rem', px: '320px' },
              { size: '96', rem: '24rem', px: '384px' },
            ].map(({ size, rem, px }) => (
              <div key={size} className="bg-surface-raised p-3 rounded">
                <div className="flex justify-between items-center">
                  <code className="text-primary font-semibold">{size}</code>
                  <div className="text-right">
                    <div className="text-sm text-foreground">{rem}</div>
                    <div className="text-xs text-foreground-de-emp">{px}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Padding Utilities */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Padding Utilities</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Add internal spacing to elements with padding utilities.
          </p>

          <div className="space-y-8">
            {/* All Sides */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">All Sides (p-*)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-100 rounded">
                  <div className="p-2 bg-surface rounded border border-border">
                    <code className="text-sm text-primary">p-2</code> (8px)
                  </div>
                </div>
                <div className="bg-blue-100 rounded">
                  <div className="p-4 bg-surface rounded border border-border">
                    <code className="text-sm text-primary">p-4</code> (16px)
                  </div>
                </div>
                <div className="bg-blue-100 rounded">
                  <div className="p-6 bg-surface rounded border border-border">
                    <code className="text-sm text-primary">p-6</code> (24px)
                  </div>
                </div>
                <div className="bg-blue-100 rounded">
                  <div className="p-8 bg-surface rounded border border-border">
                    <code className="text-sm text-primary">p-8</code> (32px)
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal/Vertical */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Horizontal & Vertical</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Horizontal (px-*)</p>
                  <div className="bg-blue-100 rounded">
                    <div className="px-8 py-4 bg-surface rounded border border-border">
                      <code className="text-sm text-primary">px-8</code> (32px left/right)
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Vertical (py-*)</p>
                  <div className="bg-blue-100 rounded">
                    <div className="px-4 py-8 bg-surface rounded border border-border">
                      <code className="text-sm text-primary">py-8</code> (32px top/bottom)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Sides */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Individual Sides</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Top</p>
                  <div className="bg-blue-100 rounded">
                    <div className="pt-6 p-2 bg-surface rounded border border-border">
                      <code className="text-xs text-primary">pt-6</code>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Right</p>
                  <div className="bg-blue-100 rounded">
                    <div className="pr-6 p-2 bg-surface rounded border border-border">
                      <code className="text-xs text-primary">pr-6</code>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Bottom</p>
                  <div className="bg-blue-100 rounded">
                    <div className="pb-6 p-2 bg-surface rounded border border-border">
                      <code className="text-xs text-primary">pb-6</code>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-emp mb-2">Left</p>
                  <div className="bg-blue-100 rounded">
                    <div className="pl-6 p-2 bg-surface rounded border border-border">
                      <code className="text-xs text-primary">pl-6</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Margin Utilities */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Margin Utilities</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Add external spacing between elements with margin utilities.
          </p>

          <div className="space-y-8">
            {/* Positive Margins */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Positive Margins</h3>
              <div className="bg-surface-raised p-6 rounded space-y-4">
                <div className="bg-green-100 p-2 rounded inline-block">
                  <div className="m-4 bg-surface p-3 rounded border border-border">
                    <code className="text-sm text-primary">m-4</code> (16px all sides)
                  </div>
                </div>
                <div className="bg-green-100 p-2 rounded inline-block ml-4">
                  <div className="mx-6 my-2 bg-surface p-3 rounded border border-border">
                    <code className="text-sm text-primary">mx-6 my-2</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Negative Margins */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Negative Margins</h3>
              <p className="text-sm text-foreground-de-emp mb-4">
                Use negative margins (e.g., <code className="text-primary">-m-4</code>) to pull
                elements closer together or overlap them.
              </p>
              <div className="bg-surface-raised p-8 rounded">
                <div className="bg-blue-500 text-white p-4 rounded">First element</div>
                <div className="bg-orange-500 text-white p-4 rounded -mt-4">
                  <code className="text-sm">-mt-4</code> pulls this up by 16px
                </div>
              </div>
            </div>

            {/* Auto Margins */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Auto Margins (Centering)</h3>
              <div className="bg-surface-raised p-6 rounded">
                <div className="mx-auto w-64 bg-primary text-primary-inverse p-4 rounded text-center">
                  <code className="text-sm">mx-auto</code> centers horizontally
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gap Utilities */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Gap Utilities (Flexbox & Grid)</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Control spacing between flex or grid items without margins.
          </p>

          <div className="space-y-8">
            {/* Flex Gap */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Flex Gap</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-de-emp mb-2">gap-2 (8px)</p>
                  <div className="flex gap-2 bg-surface-raised p-4 rounded">
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-de-emp mb-2">gap-4 (16px)</p>
                  <div className="flex gap-4 bg-surface-raised p-4 rounded">
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-de-emp mb-2">gap-8 (32px)</p>
                  <div className="flex gap-8 bg-surface-raised p-4 rounded">
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                    <div className="bg-primary text-primary-inverse p-3 rounded">Item</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Gap */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Grid Gap</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-de-emp mb-2">gap-4 (16px)</p>
                  <div className="grid grid-cols-3 gap-4 bg-surface-raised p-4 rounded">
                    <div className="bg-blue-500 text-white p-4 rounded text-center">1</div>
                    <div className="bg-blue-500 text-white p-4 rounded text-center">2</div>
                    <div className="bg-blue-500 text-white p-4 rounded text-center">3</div>
                    <div className="bg-blue-500 text-white p-4 rounded text-center">4</div>
                    <div className="bg-blue-500 text-white p-4 rounded text-center">5</div>
                    <div className="bg-blue-500 text-white p-4 rounded text-center">6</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Directional Gap */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-4">Directional Gap</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-de-emp mb-2">gap-x-8 gap-y-4</p>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-4 bg-surface-raised p-4 rounded">
                    <div className="bg-green-500 text-white p-4 rounded text-center">A</div>
                    <div className="bg-green-500 text-white p-4 rounded text-center">B</div>
                    <div className="bg-green-500 text-white p-4 rounded text-center">C</div>
                    <div className="bg-green-500 text-white p-4 rounded text-center">D</div>
                    <div className="bg-green-500 text-white p-4 rounded text-center">E</div>
                    <div className="bg-green-500 text-white p-4 rounded text-center">F</div>
                  </div>
                  <p className="text-xs text-foreground-de-emp mt-2">
                    32px horizontal gap, 16px vertical gap
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Space Between */}
        <div className="card card-elevated p-8 mb-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Space Between</h2>
          <p className="text-l text-foreground-de-emp mb-6">
            Add spacing between child elements without affecting first/last items.
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-foreground-de-emp mb-2">space-y-4 (Vertical)</p>
              <div className="space-y-4 bg-surface-raised p-4 rounded">
                <div className="bg-purple-500 text-white p-3 rounded">First item</div>
                <div className="bg-purple-500 text-white p-3 rounded">Second item</div>
                <div className="bg-purple-500 text-white p-3 rounded">Third item</div>
              </div>
            </div>

            <div>
              <p className="text-sm text-foreground-de-emp mb-2">space-x-6 (Horizontal)</p>
              <div className="flex space-x-6 bg-surface-raised p-4 rounded">
                <div className="bg-orange-500 text-white p-3 rounded">A</div>
                <div className="bg-orange-500 text-white p-3 rounded">B</div>
                <div className="bg-orange-500 text-white p-3 rounded">C</div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Patterns */}
        <div className="card card-elevated p-8">
          <h2 className="text-h2 text-foreground-emp mb-6">Common Spacing Patterns</h2>

          <div className="space-y-8">
            {/* Card with Consistent Spacing */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">Card Layout</h3>
              <div className="card card-elevated p-6 max-w-md">
                <h3 className="text-xl font-semibold text-foreground-emp mb-4">Card Title</h3>
                <p className="text-foreground-de-emp mb-6">
                  Card content with consistent spacing. Using{' '}
                  <code className="text-primary">p-6</code> for outer padding and{' '}
                  <code className="text-primary">mb-4</code>,{' '}
                  <code className="text-primary">mb-6</code> for inner spacing.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-primary-colors">Action</button>
                  <button className="btn">Cancel</button>
                </div>
              </div>
              <code className="text-sm text-primary mt-2 block">
                p-6 (outer) + mb-4, mb-6 (inner) + gap-3 (buttons)
              </code>
            </div>

            {/* Form Layout */}
            <div>
              <h3 className="text-h3 text-foreground-emp mb-3">Form Layout</h3>
              <div className="card p-6 max-w-md">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-emp mb-2">
                      Email
                    </label>
                    <input type="email" className="input" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-emp mb-2">
                      Password
                    </label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                  <button className="btn btn-primary-colors w-full mt-6">Sign In</button>
                </div>
              </div>
              <code className="text-sm text-primary mt-2 block">
                space-y-4 (form fields) + mb-2 (labels) + mt-6 (button)
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
                <strong className="text-foreground-emp">Use consistent spacing scales:</strong>
                <br />
                Stick to common values like 2, 4, 6, 8 for predictable spacing.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">
                  Prefer gap over margin for flex/grid:
                </strong>
                <br />
                <code className="text-primary">gap-4</code> is cleaner than margins on children.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Use space-y/space-x for lists:</strong>
                <br />
                Better than applying margins to each item individually.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-success font-bold">✓</span>
              <div>
                <strong className="text-foreground-emp">Center with mx-auto:</strong>
                <br />
                Apply <code className="text-primary">mx-auto</code> with a max-width for centered
                layouts.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
