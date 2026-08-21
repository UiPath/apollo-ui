import type { FormSchema } from '@uipath/apollo-wind';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { NodePropertyPanel } from './NodePropertyPanel';

const MULTI_STEP: FormSchema = {
  id: 'http',
  title: 'HTTP',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [{ id: 'p', fields: [{ id: 'url', name: 'url', type: 'text', label: 'URL' }] }],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [{ id: 'a', fields: [{ id: 'nid', name: 'nid', type: 'text', label: 'ID' }] }],
    },
  ],
};

describe('NodePropertyPanel', () => {
  it('renders the title bar when panelTitle is set', () => {
    render(<NodePropertyPanel panelTitle="Properties" schema={MULTI_STEP} />);
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('hides the title bar (and close) when panelTitle is omitted', () => {
    render(<NodePropertyPanel schema={MULTI_STEP} />);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <NodePropertyPanel panelTitle="Properties" schema={MULTI_STEP} onClose={onClose} />
    );
    getByRole('button', { name: 'Close' }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('forwards dragHandleProps to the title-bar drag handle', () => {
    const onPointerDown = vi.fn();
    const { container } = render(
      <NodePropertyPanel
        panelTitle="Properties"
        dragHandleProps={{ draggable: true, 'aria-label': 'Move properties', onPointerDown }}
      />
    );
    const dragHandle = container.querySelector('[data-slot="node-property-panel-drag-handle"]');

    expect(dragHandle).toHaveAttribute('draggable', 'true');
    expect(dragHandle).toHaveAttribute('aria-label', 'Move properties');
    dragHandle?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it('renders the node label and category in the identity row', () => {
    render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        schema={MULTI_STEP}
      />
    );
    expect(screen.getByText('Fetch invoice details')).toBeInTheDocument();
    expect(screen.getByText('HTTP Request')).toBeInTheDocument();
  });

  it('renders a tab per step for a multi-step schema', () => {
    render(<NodePropertyPanel schema={MULTI_STEP} />);
    expect(screen.getByRole('tab', { name: 'Parameters' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Advanced' })).toBeInTheDocument();
  });

  it('renders the empty state when no schema is provided', () => {
    render(<NodePropertyPanel />);
    expect(screen.getByText(/No form schema/i)).toBeInTheDocument();
  });

  it('does not render a Submit button by default (live-edit surface)', () => {
    render(<NodePropertyPanel schema={MULTI_STEP} />);
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
  });

  it('renders children instead of the form when children are provided', () => {
    render(
      <NodePropertyPanel schema={MULTI_STEP}>
        <div data-testid="custom-body">custom content</div>
      </NodePropertyPanel>
    );
    expect(screen.getByTestId('custom-body')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Parameters' })).not.toBeInTheDocument();
  });

  it('renders headerExtra content in the title bar when panelTitle is set', () => {
    render(
      <NodePropertyPanel
        panelTitle="Properties"
        headerExtra={<span data-testid="header-extra">extra</span>}
      />
    );
    expect(screen.getByTestId('header-extra')).toBeInTheDocument();
  });

  it('forwards autoComplete to the form for a multi-step schema', () => {
    const { container } = render(<NodePropertyPanel schema={MULTI_STEP} autoComplete="off" />);
    expect(container.querySelector('form')).toHaveAttribute('autocomplete', 'off');
  });

  it('forwards autoComplete to the form for a single-page schema', () => {
    const SINGLE_PAGE: FormSchema = {
      id: 'http',
      title: 'HTTP',
      sections: [{ id: 'p', fields: [{ id: 'url', name: 'url', type: 'text', label: 'URL' }] }],
    };
    const { container } = render(<NodePropertyPanel schema={SINGLE_PAGE} autoComplete="off" />);
    expect(container.querySelector('form')).toHaveAttribute('autocomplete', 'off');
  });

  it('renders the form without an autocomplete attribute when autoComplete is omitted', () => {
    const { container } = render(<NodePropertyPanel schema={MULTI_STEP} />);
    expect(container.querySelector('form')).not.toHaveAttribute('autocomplete');
  });
});
