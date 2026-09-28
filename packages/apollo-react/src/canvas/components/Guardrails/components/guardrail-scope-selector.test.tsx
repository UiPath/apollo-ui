import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../../i18n';
import type { GuardrailSelector } from '../builder-types';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { GuardrailScopeSelector } from './guardrail-scope-selector';

describe('GuardrailScopeSelector', () => {
  const defaultProps = {
    selector: { scopes: [] } as GuardrailSelector,
    onChange: vi.fn(),
    availableToolNames: ['ToolA', 'ToolB'],
    labels: GUARDRAIL_BUILDER_EN_LABELS,
  };

  // Asserted directly rather than via the axe check below: axe has no orphan-<label> rule and
  // the chips have accessible names of their own, so the a11y suite passes over a group with no
  // name at all.
  describe('group naming', () => {
    it('names the scopes group with its label and associates the error', () => {
      render(
        <GuardrailScopeSelector {...defaultProps} errors={{ scopes: 'At least one scope' }} />
      );

      const group = screen.getByRole('group', { name: /scopes/i });
      expect(group).toBeInTheDocument();
      // Deliberately no aria-required: it is not allowed on role=group and trips
      // aria-allowed-attr. The label's RequiredIndicator carries that.
      expect(group).not.toHaveAttribute('aria-required');

      const describedBy = group.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toHaveTextContent(
        'At least one scope'
      );
    });

    it('names the tools group once Tool scope is selected', () => {
      render(
        <GuardrailScopeSelector
          {...defaultProps}
          selector={{ scopes: ['Tool'] } as GuardrailSelector}
        />
      );

      expect(screen.getByRole('group', { name: /tools/i })).toBeInTheDocument();
    });

    it('leaves aria-describedby off when there is no error', () => {
      render(<GuardrailScopeSelector {...defaultProps} />);
      const group = screen.getByRole('group', { name: /scopes/i });
      expect(group).not.toHaveAttribute('aria-describedby');
    });
  });

  it('renders all scope buttons by default', () => {
    render(<GuardrailScopeSelector {...defaultProps} />);

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('LLM calls')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('renders only allowed scopes when provided', () => {
    render(<GuardrailScopeSelector {...defaultProps} allowedScopes={['Tool']} />);

    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('LLM calls')).not.toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('calls onChange when toggling a scope on', () => {
    const onChange = vi.fn();
    render(<GuardrailScopeSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('Agent'));
    expect(onChange).toHaveBeenCalledWith({ scopes: ['Agent'] });
  });

  it('calls onChange when toggling a scope off', () => {
    const onChange = vi.fn();
    render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Agent', 'Llm'] }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Agent'));
    expect(onChange).toHaveBeenCalledWith({ scopes: ['Llm'] });
  });

  it('pre-selects all tools when toggling Tool scope on', () => {
    const onChange = vi.fn();
    render(<GuardrailScopeSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('Tools'));
    expect(onChange).toHaveBeenCalledWith({ scopes: ['Tool'], matchNames: ['ToolA', 'ToolB'] });
  });

  it('shows tool selectors when Tool scope is selected', () => {
    render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Tool'], matchNames: ['ToolA', 'ToolB'] }}
      />
    );

    expect(screen.getByText('ToolA')).toBeInTheDocument();
    expect(screen.getByText('ToolB')).toBeInTheDocument();
  });

  it('does not show tool selectors when Tool scope is not selected', () => {
    render(<GuardrailScopeSelector {...defaultProps} selector={{ scopes: ['Agent'] }} />);

    expect(screen.queryByText('ToolA')).not.toBeInTheDocument();
    expect(screen.queryByText('ToolB')).not.toBeInTheDocument();
  });

  it('toggles individual tool when clicked', () => {
    const onChange = vi.fn();
    render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Tool'], matchNames: ['ToolA', 'ToolB'] }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('ToolA'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ matchNames: ['ToolB'] }));
  });

  it('marks only tools in matchNames as pressed; newly-added tools render unpressed (AL-428)', () => {
    // A guardrail targeting only ToolA shouldn't read as "applied" for ToolB once ToolB
    // joins the agent: ToolA stays pressed (targeted), ToolB renders unpressed (addable).
    render(
      <GuardrailScopeSelector
        selector={{ scopes: ['Agent', 'Tool'], matchNames: ['ToolA'] }}
        onChange={vi.fn()}
        availableToolNames={['ToolA', 'ToolB']}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    expect(screen.getByRole('button', { name: 'ToolA', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ToolB', pressed: false })).toBeInTheDocument();
  });

  it('clicking an unpressed tool adds it to matchNames', () => {
    const onChange = vi.fn();
    render(
      <GuardrailScopeSelector
        selector={{ scopes: ['Tool'], matchNames: ['ToolA'] }}
        onChange={onChange}
        availableToolNames={['ToolA', 'ToolB']}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'ToolB', pressed: false }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ matchNames: ['ToolA', 'ToolB'] })
    );
  });

  it('shows Scopes label with required indicator', () => {
    render(<GuardrailScopeSelector {...defaultProps} />);

    expect(screen.getByText('Scopes')).toBeInTheDocument();
    expect(screen.getAllByText('*').length).toBeGreaterThan(0);
  });

  it('does not show tool selectors when no tools are available', () => {
    render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Tool'] }}
        availableToolNames={[]}
      />
    );

    expect(screen.queryByText('Tools', { selector: 'label' })).not.toBeInTheDocument();
  });

  it('hides Tool scope button when no tools are available', () => {
    render(
      <GuardrailScopeSelector {...defaultProps} selector={{ scopes: [] }} availableToolNames={[]} />
    );

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('LLM calls')).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });

  it('strips Tool scope via onChange when tools disappear while Tool is selected', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <GuardrailScopeSelector
        selector={{ scopes: ['Agent', 'Tool'], matchNames: ['ToolA'] }}
        onChange={onChange}
        availableToolNames={['ToolA']}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <GuardrailScopeSelector
        selector={{ scopes: ['Agent', 'Tool'], matchNames: ['ToolA'] }}
        onChange={onChange}
        availableToolNames={[]}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    expect(onChange).toHaveBeenCalledWith({ scopes: ['Agent'] });
  });

  it('does not call onChange when tools disappear but Tool scope is not selected', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <GuardrailScopeSelector
        selector={{ scopes: ['Agent'] }}
        onChange={onChange}
        availableToolNames={['ToolA']}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    rerender(
      <GuardrailScopeSelector
        selector={{ scopes: ['Agent'] }}
        onChange={onChange}
        availableToolNames={[]}
        labels={GUARDRAIL_BUILDER_EN_LABELS}
      />
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders scope and tool errors', () => {
    render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Tool'], matchNames: [] }}
        errors={{
          scopes: 'At least one scope is required',
          toolNames: 'At least one tool is required',
        }}
      />
    );

    expect(screen.getByText('At least one scope is required')).toBeInTheDocument();
    expect(screen.getByText('At least one tool is required')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailScopeSelector
        {...defaultProps}
        selector={{ scopes: ['Agent', 'Tool'], matchNames: ['ToolA'] }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('standalone defaults', () => {
    it('renders with no labels prop at all', () => {
      render(
        <GuardrailScopeSelector
          selector={{ scopes: ['Tool'], matchNames: ['ToolA'] }}
          onChange={vi.fn()}
          availableToolNames={['ToolA']}
        />
      );

      expect(screen.getByRole('group', { name: /scopes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Agent' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'LLM calls' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /^tools/i })).toBeInTheDocument();
    });

    it('takes a partial labels override and resolves the rest', () => {
      render(
        <GuardrailScopeSelector
          selector={{ scopes: [] }}
          onChange={vi.fn()}
          labels={{ scopesLabel: 'Applies to', scopeLlmLabel: 'Model calls' }}
        />
      );

      expect(screen.getByRole('group', { name: /applies to/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Model calls' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Agent' })).toBeInTheDocument();
    });

    it('resolves its labels from the canvas catalog', async () => {
      render(
        <ApI18nProvider component="canvas" locale="ja">
          <GuardrailScopeSelector selector={{ scopes: [] }} onChange={vi.fn()} />
        </ApI18nProvider>
      );

      expect(await screen.findByText('スコープ')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'エージェント' })).toBeInTheDocument();
    });

    it('merges className onto its root', () => {
      const { container } = render(
        <GuardrailScopeSelector
          selector={{ scopes: [] }}
          onChange={vi.fn()}
          className="border-t pt-3"
        />
      );

      const root = container.querySelector('[data-slot="guardrail-scope-selector"]');
      expect(root).toHaveClass('space-y-3', 'border-t', 'pt-3');
    });

    it('has no accessibility violations with both errors showing', async () => {
      const { container } = render(
        <GuardrailScopeSelector
          selector={{ scopes: ['Tool'], matchNames: [] }}
          onChange={vi.fn()}
          availableToolNames={['ToolA', 'ToolB']}
          errors={{
            scopes: 'At least one scope is required',
            toolNames: 'At least one tool is required',
          }}
        />
      );

      expect(screen.getByRole('group', { name: /^tools/i })).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
