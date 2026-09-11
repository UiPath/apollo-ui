import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  BYO_CONNECTOR_ONLY_DEFINITION,
  BYO_FOLDER_DEFINITION,
  MIXED_DEFINITIONS,
  PII_DEFINITION,
  UIPATH_DEFINITIONS,
  UNAUTHORIZED_DEFINITION,
} from './__fixtures__/guardrail-palette.fixtures';
import type { EnrichedGuardrailDefinition } from './definitions-enrich';
import { GuardrailPalette, type GuardrailPaletteProps } from './guardrail-palette';

function renderPalette(props: Partial<GuardrailPaletteProps> = {}) {
  const merged: GuardrailPaletteProps = {
    ootbDefinitions: UIPATH_DEFINITIONS,
    onSelectOotb: vi.fn(),
    ...props,
  };
  return render(<GuardrailPalette {...merged} />);
}

const entries = () => screen.getAllByRole('button').map((item) => item.textContent);

describe('GuardrailPalette', () => {
  it('offers every definition it is given, in payload order', () => {
    renderPalette();

    expect(entries()).toEqual([
      'PII detectionDetects personally identifiable information in agent traffic.',
      'Prompt attacksDetects attempts to override the agent instructions.',
    ]);
  });

  it('reports the chosen definition, unchanged', () => {
    const onSelectOotb = vi.fn();
    renderPalette({ onSelectOotb });

    fireEvent.click(screen.getByRole('button', { name: /PII detection/ }));
    expect(onSelectOotb).toHaveBeenCalledWith(PII_DEFINITION);
  });

  it('hands a host its own richer definition type back', () => {
    // The generic is what keeps `parameters` (and everything else the palette never reads) on
    // the object the host gets back, so it can open its builder without a second lookup.
    const enriched: EnrichedGuardrailDefinition[] = [
      {
        validator: 'pii_detection',
        displayName: 'PII detection',
        description: 'Detects PII.',
        allowedScopes: ['Agent', 'Tool'],
        parameters: [
          {
            id: 'entities',
            type: 'enum-list',
            label: 'Entities',
            required: true,
            defaultValue: [],
          },
        ],
        status: 'Available',
      },
    ];
    const onSelectOotb = vi.fn<(definition: EnrichedGuardrailDefinition) => void>();
    render(<GuardrailPalette ootbDefinitions={enriched} onSelectOotb={onSelectOotb} />);

    fireEvent.click(screen.getByRole('button', { name: /PII detection/ }));
    expect(onSelectOotb).toHaveBeenCalledWith(enriched[0]);
  });

  it('names its region, so a host dropping it into a sidebar gets one for free', () => {
    renderPalette();

    expect(screen.getByRole('group', { name: 'Available guardrails' })).toBeInTheDocument();
  });

  describe('grouping', () => {
    it('renders no heading at all when there is nothing to disambiguate', () => {
      const { container } = renderPalette();

      expect(container.textContent).not.toContain('UiPath guardrails');
    });

    it('heads bring-your-own folders and trails the UiPath group', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS });

      expect(screen.getByRole('group', { name: 'Acme Guard' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Shared/Security' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'UiPath guardrails' })).toBeInTheDocument();
      expect(entries()).toEqual([
        'Acme policy checkAcme Guard',
        'Noma prompt shieldNoma SecurityVendor-managed prompt injection detection.',
        'PII detectionDetects personally identifiable information in agent traffic.',
        'Prompt attacksDetects attempts to override the agent instructions.',
      ]);
    });

    it('chips the bring-your-own connector on its entry', () => {
      renderPalette({ ootbDefinitions: [BYO_CONNECTOR_ONLY_DEFINITION, PII_DEFINITION] });

      expect(
        screen.getByText('Acme Guard', { selector: '[data-slot="guardrail-status-chip"]' })
      ).toBeInTheDocument();
    });
  });

  describe('an unauthorized definition', () => {
    it('is offered, chipped and not choosable', () => {
      const onSelectOotb = vi.fn();
      renderPalette({
        ootbDefinitions: [PII_DEFINITION, UNAUTHORIZED_DEFINITION],
        onSelectOotb,
      });

      const item = screen.getByRole('button', { name: /Harmful content/ });
      expect(item).toHaveTextContent('Unauthorized');
      expect(item).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(item);
      expect(onSelectOotb).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('rovers the arrow keys across groups and keeps one tab stop', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, onCreateCustom: vi.fn() });

      // create-custom, then two bring-your-own groups of one, then the two UiPath entries.
      const items = screen.getAllByRole('button');
      expect(items).toHaveLength(5);
      const first = screen.getByRole('button', { name: /Custom guardrail/ });
      const second = screen.getByRole('button', { name: /Acme policy check/ });
      const last = screen.getByRole('button', { name: /Prompt attacks/ });
      const tabStops = () => items.filter((item) => item.tabIndex === 0);

      expect(tabStops()).toEqual([first]);

      first.focus();
      fireEvent.keyDown(first, { key: 'ArrowDown' });
      expect(second).toHaveFocus();
      // The tab stop follows focus, so leaving and re-entering the palette comes back here.
      expect(tabStops()).toEqual([second]);

      fireEvent.keyDown(second, { key: 'ArrowUp' });
      expect(first).toHaveFocus();

      // End and Home cross every group boundary, which is what a flat roving index buys.
      fireEvent.keyDown(first, { key: 'End' });
      expect(last).toHaveFocus();

      // Clamped rather than wrapped.
      fireEvent.keyDown(last, { key: 'ArrowDown' });
      expect(last).toHaveFocus();

      fireEvent.keyDown(last, { key: 'Home' });
      expect(first).toHaveFocus();
    });

    it('rovers inside a shadow root, where document.activeElement is the host', () => {
      // Agents renders the family in a shadow root (Pattern B). `document.activeElement` there
      // is the host element, never the focused entry, so a handler that looks the entry up that
      // way leaves Arrow/Home/End doing nothing in one of the two hosts.
      const host = document.createElement('div');
      document.body.appendChild(host);
      const mount = document.createElement('div');
      host.attachShadow({ mode: 'open' }).appendChild(mount);

      render(<GuardrailPalette ootbDefinitions={UIPATH_DEFINITIONS} onSelectOotb={vi.fn()} />, {
        container: mount,
      });

      const shadow = within(mount);
      const first = shadow.getByRole('button', { name: /PII detection/ });
      const second = shadow.getByRole('button', { name: /Prompt attacks/ });

      first.focus();
      expect(document.activeElement).not.toBe(first);

      fireEvent.keyDown(first, { key: 'ArrowDown' });
      expect(host.shadowRoot?.activeElement).toBe(second);
      expect(second.tabIndex).toBe(0);

      host.remove();
    });

    it('reaches the unauthorized entry, which is the reason it is aria-disabled', () => {
      renderPalette({ ootbDefinitions: [PII_DEFINITION, UNAUTHORIZED_DEFINITION] });

      const available = screen.getByRole('button', { name: /PII detection/ });
      const unauthorized = screen.getByRole('button', { name: /Harmful content/ });

      available.focus();
      fireEvent.keyDown(available, { key: 'ArrowDown' });

      expect(unauthorized).toHaveAttribute('aria-disabled', 'true');
      expect(unauthorized).toHaveFocus();
      expect(unauthorized).toHaveTextContent('Unauthorized');
    });
  });

  describe('the create-custom entry', () => {
    it('appears only when the host wires the intent, first and with a description', () => {
      const onCreateCustom = vi.fn();
      renderPalette({ onCreateCustom });

      expect(entries()[0]).toBe('Custom guardrailCreate a guardrail with custom rules');
      fireEvent.click(screen.getByRole('button', { name: /Custom guardrail/ }));
      expect(onCreateCustom).toHaveBeenCalledTimes(1);
    });

    it('is absent when the host owns the affordance itself', () => {
      renderPalette();

      expect(screen.queryByRole('button', { name: /Custom guardrail/ })).not.toBeInTheDocument();
    });
  });

  describe('the preview chip', () => {
    it('is off by default', () => {
      renderPalette();

      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('marks every definition entry when on, and never the create-custom one', () => {
      renderPalette({
        ootbDefinitions: MIXED_DEFINITIONS,
        previewChip: true,
        onCreateCustom: vi.fn(),
      });

      expect(screen.getAllByText('Preview')).toHaveLength(MIXED_DEFINITIONS.length);
      expect(screen.getByRole('button', { name: /Custom guardrail/ })).not.toHaveTextContent(
        'Preview'
      );
    });
  });

  describe('empty, loading and failed', () => {
    it('says so when there is nothing at all to pick', () => {
      renderPalette({ ootbDefinitions: [] });

      expect(screen.getByText('No guardrails available')).toBeInTheDocument();
    });

    it('stays quiet when the create-custom entry is still something to pick', () => {
      renderPalette({ ootbDefinitions: [], onCreateCustom: vi.fn() });

      expect(screen.queryByText('No guardrails available')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Custom guardrail/ })).toBeInTheDocument();
    });

    it('renders a polite loading line instead of the entries', () => {
      renderPalette({ isLoading: true, onCreateCustom: vi.fn() });

      expect(screen.getByRole('status')).toHaveTextContent('Loading...');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a transport failure as a status banner', () => {
      renderPalette({ error: new Error('boom'), ootbDefinitions: [] });

      expect(screen.getByText('Failed to load built-in validators')).toBeInTheDocument();
    });

    it('keeps the entries under the banner when a stale catalog is still usable', () => {
      renderPalette({ error: new Error('boom') });

      expect(screen.getByText('Failed to load built-in validators')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PII detection/ })).toBeInTheDocument();
    });
  });

  it('takes per-string label overrides over the catalog', () => {
    renderPalette({ ootbDefinitions: [], labels: { empty: 'Nothing here' } });

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPalette({
      ootbDefinitions: [...MIXED_DEFINITIONS, UNAUTHORIZED_DEFINITION, BYO_FOLDER_DEFINITION],
      onCreateCustom: vi.fn(),
      previewChip: true,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations while loading or failed', async () => {
    const { container, unmount } = renderPalette({ isLoading: true });
    expect(await axe(container)).toHaveNoViolations();
    unmount();

    const { container: failed } = renderPalette({ error: new Error('boom'), ootbDefinitions: [] });
    expect(await axe(failed)).toHaveNoViolations();
  });
});
