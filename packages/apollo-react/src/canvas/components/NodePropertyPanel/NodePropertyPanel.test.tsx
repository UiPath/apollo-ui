import type { FormSchema } from '@uipath/apollo-wind';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { NodePropertyPanel } from './NodePropertyPanel';

const MULTI_STEP: FormSchema = {
  id: 'http',
  title: 'HTTP',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [{ id: 'p', fields: [{ name: 'url', type: 'text', label: 'URL' }] }],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [{ id: 'a', fields: [{ name: 'nid', type: 'text', label: 'ID' }] }],
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

  it('locks the identity row when the panel is disabled', async () => {
    const user = userEvent.setup();
    render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice"
        nodeDescription="Calls the billing API"
        onNodeLabelChange={vi.fn()}
        onNodeLabelSubmit={vi.fn()}
        onNodeDescriptionChange={vi.fn()}
        onNodeDescriptionSubmit={vi.fn()}
        schema={MULTI_STEP}
        disabled
      />
    );

    await user.click(screen.getByTestId('node-property-panel-label'));
    await user.click(screen.getByTestId('node-property-panel-description'));

    expect(screen.queryByTestId('node-property-panel-label-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('node-property-panel-description-input')).not.toBeInTheDocument();
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

  it('renders the description instead of the category when a description is given', () => {
    render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        nodeDescription="Pulls the line items for one invoice"
        schema={MULTI_STEP}
      />
    );
    expect(screen.getByText('Pulls the line items for one invoice')).toBeInTheDocument();
    expect(screen.queryByText('HTTP Request')).not.toBeInTheDocument();
  });

  it('keeps the identity row read-only when no change handlers are given', () => {
    render(<NodePropertyPanel nodeLabel="Fetch invoice details" schema={MULTI_STEP} />);
    expect(screen.queryByRole('button', { name: /^Node name/ })).not.toBeInTheDocument();
  });

  it('makes the label editable, reporting keystrokes and the submitted value', async () => {
    const user = userEvent.setup();
    const onNodeLabelChange = vi.fn();
    const onNodeLabelSubmit = vi.fn();
    const { rerender } = render(
      <NodePropertyPanel
        nodeLabel="Fetch"
        onNodeLabelChange={onNodeLabelChange}
        onNodeLabelSubmit={onNodeLabelSubmit}
        schema={MULTI_STEP}
      />
    );

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('{End}!');

    // Controlled: the panel reports the keystroke, the owner decides what `nodeLabel` becomes.
    expect(onNodeLabelChange).toHaveBeenCalledExactlyOnceWith('Fetch!');

    rerender(
      <NodePropertyPanel
        nodeLabel="Fetch!"
        onNodeLabelChange={onNodeLabelChange}
        onNodeLabelSubmit={onNodeLabelSubmit}
        schema={MULTI_STEP}
      />
    );
    await user.keyboard('{Enter}');
    expect(onNodeLabelSubmit).toHaveBeenCalledExactlyOnceWith('Fetch!');
  });

  it('renders owner feedback under the label', () => {
    render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        onNodeLabelChange={vi.fn()}
        onNodeLabelSubmit={vi.fn()}
        nodeLabelError="Name is required"
        schema={MULTI_STEP}
      />
    );

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('makes the description editable and reports the submitted value', async () => {
    const user = userEvent.setup();
    const onNodeDescriptionSubmit = vi.fn();
    const { rerender } = render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeDescription="One invoice"
        onNodeDescriptionChange={vi.fn()}
        onNodeDescriptionSubmit={onNodeDescriptionSubmit}
        schema={MULTI_STEP}
      />
    );

    await user.click(screen.getByRole('button', { name: /^Node description/ }));
    rerender(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeDescription="Two invoices"
        onNodeDescriptionChange={vi.fn()}
        onNodeDescriptionSubmit={onNodeDescriptionSubmit}
        schema={MULTI_STEP}
      />
    );
    await user.keyboard('{Enter}');

    expect(onNodeDescriptionSubmit).toHaveBeenCalledExactlyOnceWith('Two invoices');
  });

  it('keeps the category when the description is defined but empty', () => {
    render(
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        nodeDescription=""
        schema={MULTI_STEP}
      />
    );
    expect(screen.getByText('HTTP Request')).toBeInTheDocument();
  });

  it('renders the identity row for an editable-but-empty label, so the affordance survives a cleared name', () => {
    render(
      <NodePropertyPanel
        nodeLabel=""
        nodeLabelPlaceholder="HTTP Request"
        onNodeLabelChange={vi.fn()}
        onNodeLabelSubmit={vi.fn()}
        schema={MULTI_STEP}
      />
    );
    expect(screen.getByRole('button', { name: /^Node name/ })).toHaveTextContent('HTTP Request');
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
      sections: [{ id: 'p', fields: [{ name: 'url', type: 'text', label: 'URL' }] }],
    };
    const { container } = render(<NodePropertyPanel schema={SINGLE_PAGE} autoComplete="off" />);
    expect(container.querySelector('form')).toHaveAttribute('autocomplete', 'off');
  });

  it('renders the form without an autocomplete attribute when autoComplete is omitted', () => {
    const { container } = render(<NodePropertyPanel schema={MULTI_STEP} />);
    expect(container.querySelector('form')).not.toHaveAttribute('autocomplete');
  });
});
