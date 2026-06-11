import type { FormSchema } from '@uipath/apollo-wind';
import { describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core/NodeRegistryProvider';
import type { NodeManifest } from '../../schema';
import { render, screen } from '../../utils/testing';
import { NodePropertyPanel } from './NodePropertyPanel';

// Keep MetadataForm lightweight — we only need to verify it is rendered and
// receives the correct schema id/title, not that the full form is interactive.
vi.mock('@uipath/apollo-wind', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-wind')>();
  return {
    ...actual,
    MetadataForm: ({ schema }: { schema: { id?: string; title?: string } }) => (
      <div
        data-testid="metadata-form"
        data-schema-id={schema.id}
        data-schema-title={schema.title}
      />
    ),
  };
});

// ─── Test fixtures ────────────────────────────────────────────────────────────

const SINGLE_PAGE_FORM: FormSchema = {
  id: 'http-request',
  title: 'HTTP Request',
  sections: [
    {
      id: 'main',
      fields: [{ id: 'url', type: 'text', name: 'url', label: 'URL' }],
    },
  ],
};

const MULTI_STEP_FORM: FormSchema = {
  id: 'agent',
  title: 'Agent',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        { id: 's1', fields: [{ id: 'model', type: 'text', name: 'model', label: 'Model' }] },
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [],
    },
  ],
};

function makeManifest(nodeType: string, form?: FormSchema): NodeManifest {
  return {
    nodeType,
    version: '1.0.0',
    tags: [],
    sortOrder: 0,
    display: { label: 'Test Node', icon: nodeType, shape: 'rectangle' },
    handleConfiguration: [],
    form,
  } as NodeManifest;
}

function renderInRegistry(ui: React.ReactElement, manifests: NodeManifest[] = []) {
  return render(<NodeRegistryProvider registrations={manifests}>{ui}</NodeRegistryProvider>);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NodePropertyPanel', () => {
  it('renders panel title bar when panelTitle is provided', () => {
    renderInRegistry(<NodePropertyPanel panelTitle="Properties" nodeType="uipath.test" />, [
      makeManifest('uipath.test'),
    ]);
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('does not render title bar when panelTitle is omitted', () => {
    renderInRegistry(<NodePropertyPanel nodeType="uipath.test" />, [makeManifest('uipath.test')]);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const { getByRole } = renderInRegistry(
      <NodePropertyPanel panelTitle="Properties" nodeType="uipath.test" onClose={onClose} />,
      [makeManifest('uipath.test')]
    );
    getByRole('button', { name: 'Close' }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders node label and category in the identity row', () => {
    renderInRegistry(
      <NodePropertyPanel nodeType="uipath.test" nodeLabel="My Activity" nodeCategory="HTTP" />,
      [makeManifest('uipath.test')]
    );
    expect(screen.getByText('My Activity')).toBeInTheDocument();
    expect(screen.getByText('HTTP')).toBeInTheDocument();
  });

  it('renders empty-state when no form schema is defined', () => {
    renderInRegistry(<NodePropertyPanel nodeType="uipath.test" />, [makeManifest('uipath.test')]);
    expect(screen.getByText(/No form schema defined/i)).toBeInTheDocument();
  });

  it('renders a single MetadataForm for a flat (non-multi-step) form schema', () => {
    renderInRegistry(<NodePropertyPanel nodeType="uipath.http" />, [
      makeManifest('uipath.http', SINGLE_PAGE_FORM),
    ]);
    expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
    expect(screen.getByTestId('metadata-form')).toHaveAttribute('data-schema-id', 'http-request');
  });

  it('renders tab triggers for each step in a multi-step form', () => {
    renderInRegistry(<NodePropertyPanel nodeType="uipath.agent" />, [
      makeManifest('uipath.agent', MULTI_STEP_FORM),
    ]);
    expect(screen.getByRole('tab', { name: 'Parameters' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Error handling' })).toBeInTheDocument();
  });

  it('resets the active tab when nodeType changes to a different node', () => {
    const agentManifest = makeManifest('uipath.agent', MULTI_STEP_FORM);
    const httpManifest = makeManifest('uipath.http', SINGLE_PAGE_FORM);

    const { rerender } = renderInRegistry(<NodePropertyPanel nodeType="uipath.agent" />, [
      agentManifest,
      httpManifest,
    ]);

    // Switch to a different node type — the component should reset internal tab state
    rerender(
      <NodeRegistryProvider registrations={[agentManifest, httpManifest]}>
        <NodePropertyPanel nodeType="uipath.http" />
      </NodeRegistryProvider>
    );

    // The single-page form (no tabs) should now be rendered
    expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
