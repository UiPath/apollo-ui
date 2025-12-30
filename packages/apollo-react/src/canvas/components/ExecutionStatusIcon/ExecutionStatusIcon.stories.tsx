import type { Meta, StoryObj } from '@storybook/react';
import { ExecutionStatusIcon } from './ExecutionStatusIcon';

const meta = {
  title: 'Canvas/ExecutionStatusIcon',
  component: ExecutionStatusIcon,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'InProgress',
        'Cancelled',
        'Completed',
        'Paused',
        'Failed',
        'NotExecuted',
        'Terminated',
      ],
      description: 'The execution status to display',
    },
    size: {
      control: { type: 'number', min: 12, max: 48, step: 4 },
      description: 'Icon size in pixels',
      defaultValue: 16,
    },
  },
} satisfies Meta<typeof ExecutionStatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: 'InProgress',
    size: 24,
  },
  render: () => (
    <div style={{ padding: '40px' }}>
      {/* Main grid of all statuses */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        {[
          { status: 'InProgress', label: 'In Progress', description: 'Currently executing' },
          { status: 'Completed', label: 'Completed', description: 'Successfully finished' },
          { status: 'Failed', label: 'Failed', description: 'Execution failed' },
          { status: 'Paused', label: 'Paused', description: 'Temporarily stopped' },
          { status: 'Cancelled', label: 'Cancelled', description: 'Execution cancelled' },
          { status: 'Terminated', label: 'Terminated', description: 'Forcefully stopped' },
          { status: 'NotExecuted', label: 'Not Executed', description: 'Not yet started' },
        ].map(({ status, label, description }) => (
          <div
            key={status}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '20px',
              border: '1px solid var(--uix-canvas-border-de-emp)',
              borderRadius: '8px',
              background: 'var(--uix-canvas-background)',
              minHeight: '120px',
            }}
          >
            <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
              <ExecutionStatusIcon status={status as any} size={24} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--uix-canvas-foreground)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--uix-canvas-foreground-de-emp)',
                }}
              >
                {description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Size variations */}
      <div style={{ borderTop: '1px solid var(--uix-canvas-border-de-emp)', paddingTop: '32px' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--uix-canvas-foreground)' }}>
          Size Variations
        </h3>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {[12, 16, 24, 32, 48, 64, 80].map((size) => (
            <div key={size} style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}
              >
                <ExecutionStatusIcon status="Completed" size={size} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--uix-canvas-foreground-de-emp)' }}>
                {size}px
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
