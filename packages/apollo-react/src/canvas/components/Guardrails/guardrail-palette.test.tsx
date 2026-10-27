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

      // Green, which is the colour both products give this chip today. The label lives in an
      // inner span so it can truncate, so the tone is on its parent.
      // Scoped to the chip: a connector-only definition also names its group "Acme Guard".
      expect(
        screen
          .getByText('Acme Guard', { selector: '[data-slot="guardrail-status-chip"] > span' })
          .closest('[data-slot="guardrail-status-chip"]')
      ).toHaveClass('bg-success-background');
    });
  });

  describe('byoDisplay', () => {
    it('names a BYO entry by its configuration, with a BYO chip and a provider caption', () => {
      renderPalette({ ootbDefinitions: [BYO_FOLDER_DEFINITION, PII_DEFINITION], byoDisplay: true });

      const entry = screen.getByRole('button', { name: /noma_prompt_injection/ });
      expect(within(entry).getByText('BYO')).toBeInTheDocument();
      expect(within(entry).getByText('Provider: Noma Security')).toHaveClass('italic');
      expect(screen.queryByText('Noma prompt shield')).not.toBeInTheDocument();
      // The connector no longer doubles as the chip; the folder heading is unchanged.
      expect(within(entry).queryByText('Noma Security')).not.toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Shared/Security' })).toBeInTheDocument();
    });

    it('sorts BYO entries by the configuration name they show', () => {
      const first = {
        ...BYO_CONNECTOR_ONLY_DEFINITION,
        displayName: 'Zeta check',
        byoValidatorName: 'Alpha configuration',
      };
      const second = {
        ...BYO_CONNECTOR_ONLY_DEFINITION,
        displayName: 'Alpha check',
        byoValidatorName: 'Zeta configuration',
        byoGuardrailConnectionId: 'connection-4',
      };
      renderPalette({ ootbDefinitions: [second, first], byoDisplay: true });

      expect(entries().map((text) => text?.split('BYO')[0])).toEqual([
        'Alpha configuration',
        'Zeta configuration',
      ]);
    });

    it('leaves UiPath entries as they are', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, byoDisplay: true });

      expect(screen.getByRole('button', { name: /^PII detection/ })).toBeInTheDocument();
      expect(screen.getAllByText('BYO')).toHaveLength(2);
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

      const chips = screen.getAllByText('Preview');
      expect(chips).toHaveLength(MIXED_DEFINITIONS.length);
      // Blue, which is the colour both products give this chip today.
      for (const chip of chips)
        expect(chip.closest('[data-slot="guardrail-status-chip"]')).toHaveClass(
          'bg-info-background'
        );
      expect(screen.getByRole('button', { name: /Custom guardrail/ })).not.toHaveTextContent(
        'Preview'
      );
    });

    it('skips a definition the backend says is out of preview, and keeps one that says nothing', () => {
      renderPalette({
        ootbDefinitions: [
          { ...PII_DEFINITION, isPreview: false },
          { ...BYO_FOLDER_DEFINITION, isPreview: true },
          BYO_CONNECTOR_ONLY_DEFINITION,
        ],
        previewChip: true,
      });

      expect(screen.getByRole('button', { name: /PII detection/ })).not.toHaveTextContent(
        'Preview'
      );
      expect(screen.getByRole('button', { name: /Noma prompt shield/ })).toHaveTextContent(
        'Preview'
      );
      expect(screen.getByRole('button', { name: /Acme policy check/ })).toHaveTextContent(
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

  describe('search', () => {
    // The palette's own entries, without the clear-search button that joins them mid-search.
    const shownEntries = () =>
      Array.from(document.querySelectorAll('[data-slot="guardrail-palette-item"]')).map(
        (item) => item.textContent
      );
    const search = (value: string) =>
      fireEvent.change(screen.getByRole('searchbox', { name: 'Search guardrails' }), {
        target: { value },
      });

    it('is off by default', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS });

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('narrows the entries and keeps the group they came from', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, searchable: true });

      search('security');

      expect(shownEntries()).toEqual([
        'Noma prompt shieldNoma SecurityVendor-managed prompt injection detection.',
      ]);
      expect(screen.getByRole('group', { name: 'Shared/Security' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'UiPath guardrails' })).not.toBeInTheDocument();
    });

    it('matches the configuration name a BYO entry shows under byoDisplay', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, searchable: true, byoDisplay: true });

      search('acme_policy');

      expect(shownEntries()).toEqual(['acme_policyBYOProvider: Acme Guard']);
    });

    it('keeps the create-custom entry and says when nothing matches', () => {
      renderPalette({
        ootbDefinitions: MIXED_DEFINITIONS,
        searchable: true,
        onCreateCustom: vi.fn(),
      });

      search('no such guardrail');

      expect(screen.getByText('No matching guardrails')).toBeInTheDocument();
      expect(screen.queryByText('No guardrails available')).not.toBeInTheDocument();
      expect(shownEntries()).toEqual(['Custom guardrailCreate a guardrail with custom rules']);
    });

    it('clears from its button and gives focus back to the field', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, searchable: true });
      search('pii');
      expect(shownEntries()).toHaveLength(1);

      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

      const field = screen.getByRole('searchbox', { name: 'Search guardrails' });
      expect(field).toHaveValue('');
      expect(field).toHaveFocus();
      expect(shownEntries()).toHaveLength(MIXED_DEFINITIONS.length);
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    });

    it('hands ArrowDown to the first entry, and ArrowUp on it back to the field', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, searchable: true });
      const field = screen.getByRole('searchbox', { name: 'Search guardrails' });
      search('detect');

      field.focus();
      fireEvent.keyDown(field, { key: 'ArrowDown' });
      const first = screen.getByRole('button', { name: /Noma prompt shield/ });
      expect(first).toHaveFocus();

      fireEvent.keyDown(first, { key: 'ArrowUp' });
      expect(field).toHaveFocus();
    });

    it('moves the tab stop back to the first entry when the list narrows', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, searchable: true });
      const first = screen.getByRole('button', { name: /Acme policy check/ });
      const last = screen.getByRole('button', { name: /Prompt attacks/ });
      first.focus();
      fireEvent.keyDown(first, { key: 'End' });
      expect(last.tabIndex).toBe(0);

      search('detect');

      expect(screen.getByRole('button', { name: /Noma prompt shield/ }).tabIndex).toBe(0);
      expect(screen.getByRole('button', { name: /Prompt attacks/ }).tabIndex).toBe(-1);
    });

    it('renders no controls while loading or with no catalog to search', () => {
      const { unmount } = renderPalette({ searchable: true, sourceFilter: true, isLoading: true });
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      unmount();

      renderPalette({ ootbDefinitions: [], searchable: true, onCreateCustom: vi.fn() });
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });

  describe('the source filter', () => {
    const sourceFilterGroup = () => screen.queryByRole('group', { name: 'Guardrail source' });

    it('is off by default', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS });

      expect(sourceFilterGroup()).not.toBeInTheDocument();
    });

    it('appears only while the catalog holds both UiPath and BYO entries', () => {
      const { unmount } = renderPalette({
        ootbDefinitions: UIPATH_DEFINITIONS,
        sourceFilter: true,
      });
      expect(sourceFilterGroup()).not.toBeInTheDocument();
      unmount();

      const byoOnly = renderPalette({
        ootbDefinitions: [BYO_FOLDER_DEFINITION],
        sourceFilter: true,
      });
      expect(sourceFilterGroup()).not.toBeInTheDocument();
      byoOnly.unmount();

      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true });
      expect(sourceFilterGroup()).toBeInTheDocument();
    });

    it('shows one side at a time, starting with all of it', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true });
      expect(screen.getByRole('radio', { name: 'All 4' })).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(screen.getByRole('radio', { name: 'BYO 2' }));
      expect(entries()).toEqual([
        'Acme policy checkAcme Guard',
        'Noma prompt shieldNoma SecurityVendor-managed prompt injection detection.',
      ]);

      fireEvent.click(screen.getByRole('radio', { name: 'UiPath 2' }));
      expect(entries()).toEqual([
        'PII detectionDetects personally identifiable information in agent traffic.',
        'Prompt attacksDetects attempts to override the agent instructions.',
      ]);
      // The heading stays, so the entries read the same as under All.
      expect(screen.getByRole('group', { name: 'UiPath guardrails' })).toBeInTheDocument();
    });

    it('keeps an option chosen when it is clicked again', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true });
      const byo = screen.getByRole('radio', { name: 'BYO 2' });

      fireEvent.click(byo);
      fireEvent.click(byo);

      expect(byo).toHaveAttribute('aria-checked', 'true');
      expect(entries()).toHaveLength(2);
    });

    it('counts what the search left on each side', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true, searchable: true });

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'detect' } });

      expect(screen.getByRole('radio', { name: 'All 3' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'UiPath 2' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'BYO 1' })).toBeInTheDocument();
    });

    it('says so when the side it shows has no match', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true, searchable: true });

      fireEvent.click(screen.getByRole('radio', { name: 'BYO 2' }));
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'pii' } });

      expect(screen.getByText('No matching guardrails')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'UiPath 1' })).toBeInTheDocument();
    });

    it('shows every entry again once the catalog loses a side', () => {
      const { rerender } = renderPalette({
        ootbDefinitions: MIXED_DEFINITIONS,
        sourceFilter: true,
      });
      fireEvent.click(screen.getByRole('radio', { name: 'BYO 2' }));

      rerender(
        <GuardrailPalette
          ootbDefinitions={UIPATH_DEFINITIONS}
          onSelectOotb={vi.fn()}
          sourceFilter
        />
      );

      expect(sourceFilterGroup()).not.toBeInTheDocument();
      expect(entries()).toHaveLength(UIPATH_DEFINITIONS.length);
    });

    it('hands ArrowDown from an option to the first entry', () => {
      renderPalette({ ootbDefinitions: MIXED_DEFINITIONS, sourceFilter: true });
      const all = screen.getByRole('radio', { name: 'All 4' });

      all.focus();
      fireEvent.keyDown(all, { key: 'ArrowDown' });

      expect(screen.getByRole('button', { name: /Acme policy check/ })).toHaveFocus();
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

  it('has no accessibility violations with the search and the source filter', async () => {
    const { container } = renderPalette({
      ootbDefinitions: MIXED_DEFINITIONS,
      onCreateCustom: vi.fn(),
      searchable: true,
      sourceFilter: true,
    });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'detect' } });

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
