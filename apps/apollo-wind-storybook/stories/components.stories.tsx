import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Reference/Component Utilities',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Helper component to show code examples with theme-aware styling
const CodeExample = ({ code, children }: { code: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <div
      className="mb-3 p-4 rounded border"
      style={{
        backgroundColor: 'var(--color-background-secondary, #f4f5f7)',
        borderColor: 'var(--color-border, #dde2e9)',
      }}
    >
      {children}
    </div>
    <pre
      className="p-3 rounded text-sm overflow-x-auto"
      style={{
        backgroundColor: 'var(--color-foreground, #182027)',
        color: 'var(--color-foreground-inverse, #f4f9fa)',
      }}
    >
      <code>{code}</code>
    </pre>
  </div>
);

// ============================================================================
// SECTION 4.1: INTERACTIVE COMPONENTS
// ============================================================================

export const Buttons: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Button Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Composable button utilities following Apollo Design System patterns. Combine base, size, and
        color utilities to create button variants.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Primary Buttons</h2>
      <CodeExample code='<button class="btn btn-tall btn-primary-colors">Primary Tall</button>'>
        <button className="btn btn-tall btn-primary-colors">Primary Tall</button>
      </CodeExample>

      <CodeExample code='<button class="btn btn-small btn-primary-colors">Primary Small</button>'>
        <button className="btn btn-small btn-primary-colors">Primary Small</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Secondary Buttons</h2>
      <CodeExample code='<button class="btn btn-tall btn-secondary-colors">Secondary Tall</button>'>
        <button className="btn btn-tall btn-secondary-colors">Secondary Tall</button>
      </CodeExample>

      <CodeExample code='<button class="btn btn-small btn-secondary-colors">Secondary Small</button>'>
        <button className="btn btn-small btn-secondary-colors">Secondary Small</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Tertiary Buttons</h2>
      <CodeExample code='<button class="btn btn-tall btn-tertiary-colors">Tertiary Tall</button>'>
        <button className="btn btn-tall btn-tertiary-colors">Tertiary Tall</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Destructive Buttons</h2>
      <CodeExample code='<button class="btn btn-tall btn-destructive-colors">Delete Item</button>'>
        <button className="btn btn-tall btn-destructive-colors">Delete Item</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Text Foreground Buttons</h2>
      <CodeExample code='<button class="btn btn-tall btn-text-foreground-colors">Text Button</button>'>
        <button className="btn btn-tall btn-text-foreground-colors">Text Button</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Button States</h2>
      <CodeExample code='<button class="btn btn-tall btn-primary-colors" disabled>Disabled</button>'>
        <button className="btn btn-tall btn-primary-colors" disabled>
          Disabled
        </button>
      </CodeExample>

      <CodeExample code='<button class="btn btn-tall btn-primary-colors btn-loading">Loading...</button>'>
        <button className="btn btn-tall btn-primary-colors btn-loading">Loading...</button>
      </CodeExample>
    </div>
  ),
};

export const IconButtons: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Icon Button Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Square buttons designed for icon-only interactions. Combine with icon size utilities.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Medium Icon Buttons (40x40px)</h2>
      <CodeExample code='<button class="icon-btn icon-btn-medium btn-primary-colors">🔍</button>'>
        <button className="icon-btn icon-btn-medium btn-primary-colors">🔍</button>
      </CodeExample>

      <CodeExample code='<button class="icon-btn icon-btn-medium btn-secondary-colors">⚙️</button>'>
        <button className="icon-btn icon-btn-medium btn-secondary-colors">⚙️</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Small Icon Buttons (32x32px)</h2>
      <CodeExample code='<button class="icon-btn icon-btn-small btn-primary-colors">✓</button>'>
        <button className="icon-btn icon-btn-small btn-primary-colors">✓</button>
      </CodeExample>

      <CodeExample code='<button class="icon-btn icon-btn-small btn-destructive-colors">✕</button>'>
        <button className="icon-btn icon-btn-small btn-destructive-colors">✕</button>
      </CodeExample>
    </div>
  ),
};

export const Cards: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Card Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Container components for grouping related content.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Elevated Card</h2>
      <CodeExample
        code={`<div class="card card-elevated">
  <h3>Elevated Card</h3>
  <p>Uses shadow for elevation</p>
</div>`}
      >
        <div className="card card-elevated">
          <h3 className="font-semibold mb-2">Elevated Card</h3>
          <p style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            Uses shadow for elevation (shadow-dp-2)
          </p>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Outlined Card</h2>
      <CodeExample
        code={`<div class="card card-outlined">
  <h3>Outlined Card</h3>
  <p>Uses border instead of shadow</p>
</div>`}
      >
        <div className="card card-outlined">
          <h3 className="font-semibold mb-2">Outlined Card</h3>
          <p style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            Uses border instead of shadow
          </p>
        </div>
      </CodeExample>
    </div>
  ),
};

// ============================================================================
// SECTION 4.2: FORM CONTROLS
// ============================================================================

export const FormControls: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Form Control Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Interactive form elements with Apollo Design System styling.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Input</h2>
      <CodeExample code='<input class="input" type="text" placeholder="Enter text..." />'>
        <input className="input" type="text" placeholder="Enter text..." />
      </CodeExample>

      <CodeExample code='<input class="input input-error" type="text" placeholder="Error state" />'>
        <input className="input input-error" type="text" placeholder="Error state" />
      </CodeExample>

      <CodeExample code='<input class="input input-success" type="text" placeholder="Success state" />'>
        <input className="input input-success" type="text" placeholder="Success state" />
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Select</h2>
      <CodeExample
        code={`<select class="select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>`}
      >
        <select className="select">
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </select>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Checkbox</h2>
      <CodeExample
        code={`<label class="flex items-center gap-2">
  <input class="checkbox" type="checkbox" />
  <span>Accept terms</span>
</label>`}
      >
        <label className="flex items-center gap-2">
          <input className="checkbox" type="checkbox" />
          <span>Accept terms and conditions</span>
        </label>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Radio Button</h2>
      <CodeExample
        code={`<label class="flex items-center gap-2">
  <input class="radio" type="radio" name="option" />
  <span>Option 1</span>
</label>`}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input className="radio" type="radio" name="radio-demo" />
            <span>Option 1</span>
          </label>
          <label className="flex items-center gap-2">
            <input className="radio" type="radio" name="radio-demo" />
            <span>Option 2</span>
          </label>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Switch / Toggle</h2>
      <CodeExample
        code={`<label class="flex items-center gap-2">
  <input class="switch" type="checkbox" />
  <span>Enable notifications</span>
</label>`}
      >
        <label className="flex items-center gap-2">
          <input className="switch" type="checkbox" />
          <span>Enable notifications</span>
        </label>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Textarea</h2>
      <CodeExample code='<textarea class="textarea" placeholder="Enter message..." rows={4}></textarea>'>
        <textarea className="textarea" placeholder="Enter message..." rows={4}></textarea>
      </CodeExample>
    </div>
  ),
};

// ============================================================================
// SECTION 4.3: FEEDBACK COMPONENTS
// ============================================================================

export const Badges: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Badge Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Small status indicators and labels. Combine base, size, and color utilities.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Default Size Badges</h2>
      <CodeExample code='<span class="badge badge-default-colors">Default</span>'>
        <span className="badge badge-default-colors">Default</span>
      </CodeExample>

      <CodeExample code='<span class="badge badge-primary-colors">Primary</span>'>
        <span className="badge badge-primary-colors">Primary</span>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Status Badges</h2>
      <CodeExample code='<span class="badge badge-error-colors">Error</span>'>
        <span className="badge badge-error-colors">Error</span>
      </CodeExample>

      <CodeExample code='<span class="badge badge-warning-colors">Warning</span>'>
        <span className="badge badge-warning-colors">Warning</span>
      </CodeExample>

      <CodeExample code='<span class="badge badge-success-colors">Success</span>'>
        <span className="badge badge-success-colors">Success</span>
      </CodeExample>

      <CodeExample code='<span class="badge badge-info-colors">Info</span>'>
        <span className="badge badge-info-colors">Info</span>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Size Variants</h2>
      <CodeExample code='<span class="badge badge-small-size badge-primary-colors">Small</span>'>
        <span className="badge badge-small-size badge-primary-colors">Small (16px)</span>
      </CodeExample>

      <CodeExample code='<span class="badge badge-large-size badge-primary-colors">Large</span>'>
        <span className="badge badge-large-size badge-primary-colors">Large (24px)</span>
      </CodeExample>
    </div>
  ),
};

export const Chips: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Chip Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Interactive tags and filters with hover states.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Default Chips</h2>
      <CodeExample code='<button class="chip chip-default-colors">Default Chip</button>'>
        <button className="chip chip-default-colors">Default Chip (hover me)</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Primary Chips</h2>
      <CodeExample code='<button class="chip chip-primary-colors">Primary Chip</button>'>
        <button className="chip chip-primary-colors">Primary Chip (hover me)</button>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Chip Group</h2>
      <CodeExample
        code={`<div class="flex gap-2 flex-wrap">
  <button class="chip chip-default-colors">Tag 1</button>
  <button class="chip chip-default-colors">Tag 2</button>
  <button class="chip chip-default-colors">Tag 3</button>
</div>`}
      >
        <div className="flex gap-2 flex-wrap">
          <button className="chip chip-default-colors">JavaScript</button>
          <button className="chip chip-default-colors">React</button>
          <button className="chip chip-default-colors">TypeScript</button>
          <button className="chip chip-default-colors">Tailwind</button>
        </div>
      </CodeExample>
    </div>
  ),
};

export const Alerts: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Alert Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Informational messages with semantic colors.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Info Alert</h2>
      <CodeExample
        code={`<div class="alert alert-info-colors">
  <span>ℹ️</span>
  <span>This is an informational message.</span>
</div>`}
      >
        <div className="alert alert-info-colors">
          <span>ℹ️</span>
          <span>This is an informational message with helpful context.</span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Success Alert</h2>
      <CodeExample
        code={`<div class="alert alert-success-colors">
  <span>✓</span>
  <span>Operation completed successfully!</span>
</div>`}
      >
        <div className="alert alert-success-colors">
          <span>✓</span>
          <span>Operation completed successfully! Your changes have been saved.</span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Warning Alert</h2>
      <CodeExample
        code={`<div class="alert alert-warning-colors">
  <span>⚠️</span>
  <span>Please review before proceeding.</span>
</div>`}
      >
        <div className="alert alert-warning-colors">
          <span>⚠️</span>
          <span>Please review your settings before proceeding with this action.</span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Error Alert</h2>
      <CodeExample
        code={`<div class="alert alert-error-colors">
  <span>✕</span>
  <span>An error occurred.</span>
</div>`}
      >
        <div className="alert alert-error-colors">
          <span>✕</span>
          <span>An error occurred while processing your request. Please try again.</span>
        </div>
      </CodeExample>
    </div>
  ),
};

export const ToastsAndProgress: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Toast & Progress Utilities</h1>

      <h2 className="text-2xl font-semibold mb-4">Toast Notifications</h2>
      <p className="mb-4" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Fixed-position notifications (z-index: 1400). Combine with position utilities.
      </p>

      <CodeExample
        code={`<div class="toast toast-top-right">
  <span>✓</span>
  <span>Changes saved successfully</span>
</div>`}
      >
        <div className="relative h-32 border border-gray-300 rounded overflow-hidden">
          <div className="toast" style={{ position: 'absolute', top: '24px', right: '24px' }}>
            <span>✓</span>
            <span>Changes saved</span>
          </div>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Progress Indicators</h2>
      <CodeExample
        code={`<div class="progress">
  <div class="progress-bar" style="width: 60%"></div>
</div>`}
      >
        <div className="progress">
          <div className="progress-bar" style={{ width: '60%' }}></div>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Loaders</h2>
      <CodeExample code='<div class="loader"></div>'>
        <div className="loader"></div>
      </CodeExample>

      <CodeExample code='<div class="loader loader-small"></div>'>
        <div className="loader loader-small"></div>
      </CodeExample>

      <CodeExample code='<div class="loader loader-large"></div>'>
        <div className="loader loader-large"></div>
      </CodeExample>
    </div>
  ),
};

export const Tooltips: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Tooltip Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        Hover information (z-index: 1500). Positioned absolutely relative to parent.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Top Tooltip</h2>
      <CodeExample
        code={`<div class="relative inline-block">
  <button class="btn btn-tall btn-primary-colors">Hover me</button>
  <span class="tooltip tooltip-top">Tooltip text</span>
</div>`}
      >
        <div className="relative inline-block">
          <button className="btn btn-tall btn-primary-colors">Hover for tooltip</button>
          <span className="tooltip tooltip-top" style={{ opacity: 1, pointerEvents: 'none' }}>
            This is a tooltip
          </span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Bottom Tooltip</h2>
      <CodeExample
        code={`<div class="relative inline-block">
  <button>Hover me</button>
  <span class="tooltip tooltip-bottom">Tooltip text</span>
</div>`}
      >
        <div className="relative inline-block">
          <button className="btn btn-tall btn-secondary-colors">Hover for tooltip</button>
          <span className="tooltip tooltip-bottom" style={{ opacity: 1, pointerEvents: 'none' }}>
            Bottom tooltip
          </span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Left Tooltip</h2>
      <CodeExample
        code={`<div class="relative inline-block">
  <button>Hover me</button>
  <span class="tooltip tooltip-left">Tooltip text</span>
</div>`}
      >
        <div className="relative inline-block ml-32">
          <button className="btn btn-tall btn-tertiary-colors">Hover for tooltip</button>
          <span className="tooltip tooltip-left" style={{ opacity: 1, pointerEvents: 'none' }}>
            Left tooltip
          </span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Right Tooltip</h2>
      <CodeExample
        code={`<div class="relative inline-block">
  <button>Hover me</button>
  <span class="tooltip tooltip-right">Tooltip text</span>
</div>`}
      >
        <div className="relative inline-block">
          <button className="btn btn-tall btn-destructive-colors">Hover for tooltip</button>
          <span className="tooltip tooltip-right" style={{ opacity: 1, pointerEvents: 'none' }}>
            Right tooltip
          </span>
        </div>
      </CodeExample>
    </div>
  ),
};

// ============================================================================
// SECTION 4.4: ICON SIZES
// ============================================================================

export const IconSizes: StoryObj = {
  render: () => (
    <div className="p-8 max-w-4xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Icon Size Utilities</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        7 icon sizes aligned with Apollo Core token scale (IconXxs through IconXxl).
      </p>

      <h2 className="text-2xl font-semibold mb-4">Icon Size Scale</h2>

      <CodeExample code='<span class="icon-xxs">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-xxs">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-xxs (14px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-xs">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-xs">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-xs (16px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-sm">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-sm">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-sm (18px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-md">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-md">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-md (24px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-lg">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-lg">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-lg (28px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-xl">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-xl">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-xl (32px)
          </span>
        </div>
      </CodeExample>

      <CodeExample code='<span class="icon-xxl">🔍</span>'>
        <div className="flex items-center gap-3">
          <span className="icon-xxl">🔍</span>
          <span className="text-sm" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
            icon-xxl (48px)
          </span>
        </div>
      </CodeExample>

      <h2 className="text-2xl font-semibold mb-4 mt-8">Icon Sizes with Icon Buttons</h2>
      <CodeExample code='<button class="icon-btn icon-btn-medium btn-primary-colors"><span class="icon-md">⚙️</span></button>'>
        <button className="icon-btn icon-btn-medium btn-primary-colors">
          <span className="icon-md">⚙️</span>
        </button>
      </CodeExample>

      <CodeExample code='<button class="icon-btn icon-btn-small btn-secondary-colors"><span class="icon-sm">✓</span></button>'>
        <button className="icon-btn icon-btn-small btn-secondary-colors">
          <span className="icon-sm">✓</span>
        </button>
      </CodeExample>
    </div>
  ),
};

// ============================================================================
// COMPLETE EXAMPLE
// ============================================================================

export const CompleteExample: StoryObj = {
  render: () => (
    <div className="p-8 max-w-6xl" style={{ color: 'var(--color-foreground, #182027)' }}>
      <h1 className="text-3xl font-bold mb-6">Complete Example: User Profile Card</h1>
      <p className="mb-8" style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
        A realistic example combining multiple Apollo Wind utilities.
      </p>

      <CodeExample
        code={`<div class="card card-elevated">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <span class="icon-lg">👤</span>
      <div>
        <h3 class="font-semibold">John Doe</h3>
        <span class="badge badge-small-size badge-success-colors">Active</span>
      </div>
    </div>
    <button class="icon-btn icon-btn-medium btn-tertiary-colors">
      <span class="icon-md">⚙️</span>
    </button>
  </div>

  <!-- Content -->
  <div class="alert alert-info-colors mb-4">
    <span>ℹ️</span>
    <span>Profile verification pending</span>
  </div>

  <!-- Form -->
  <div class="space-y-4">
    <input class="input" type="text" placeholder="Email" />
    <textarea class="textarea" placeholder="Bio" rows={3}></textarea>

    <label class="flex items-center gap-2">
      <input class="checkbox" type="checkbox" />
      <span>Receive notifications</span>
    </label>
  </div>

  <!-- Actions -->
  <div class="flex gap-2 mt-4">
    <button class="btn btn-tall btn-primary-colors">Save Changes</button>
    <button class="btn btn-tall btn-secondary-colors">Cancel</button>
  </div>

  <!-- Progress -->
  <div class="mt-4">
    <div class="flex justify-between text-sm mb-2">
      <span>Profile Completion</span>
      <span>75%</span>
    </div>
    <div class="progress">
      <div class="progress-bar" style="width: 75%"></div>
    </div>
  </div>
</div>`}
      >
        <div className="card card-elevated">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="icon-lg">👤</span>
              <div>
                <h3 className="font-semibold">John Doe</h3>
                <span className="badge badge-small-size badge-success-colors">Active</span>
              </div>
            </div>
            <button className="icon-btn icon-btn-medium btn-tertiary-colors">
              <span className="icon-md">⚙️</span>
            </button>
          </div>

          {/* Content */}
          <div className="alert alert-info-colors mb-4">
            <span>ℹ️</span>
            <span>Profile verification pending</span>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <input
              className="input"
              type="text"
              placeholder="Email"
              defaultValue="john.doe@example.com"
            />
            <textarea
              className="textarea"
              placeholder="Bio"
              rows={3}
              defaultValue="Software developer interested in design systems..."
            />

            <label className="flex items-center gap-2">
              <input className="checkbox" type="checkbox" defaultChecked />
              <span>Receive email notifications</span>
            </label>

            <label className="flex items-center gap-2">
              <input className="switch" type="checkbox" defaultChecked />
              <span>Enable dark mode</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="btn btn-tall btn-primary-colors">Save Changes</button>
            <button className="btn btn-tall btn-secondary-colors">Cancel</button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: 'var(--color-foreground-de-emp, #7d8694)' }}>
                Profile Completion
              </span>
              <span className="font-semibold">75%</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </CodeExample>
    </div>
  ),
};
