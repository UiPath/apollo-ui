import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { MixedScopesBanner } from './mixed-scopes-banner';

const labels = GUARDRAIL_BUILDER_EN_LABELS;

describe('MixedScopesBanner', () => {
  it('renders nothing when otherAppliedScopes is null', () => {
    const { container } = render(<MixedScopesBanner otherAppliedScopes={null} labels={labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the pre-localized scope labels', () => {
    render(
      <MixedScopesBanner
        otherAppliedScopes={{ scopes: ['Agent', 'LLM calls'], tools: [] }}
        labels={labels}
      />
    );

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('LLM calls')).toBeInTheDocument();
  });

  it('renders the tool names', () => {
    render(
      <MixedScopesBanner
        otherAppliedScopes={{ scopes: [], tools: ['Tool B', 'Tool C'] }}
        labels={labels}
      />
    );

    expect(screen.getByText('Tool B')).toBeInTheDocument();
    expect(screen.getByText('Tool C')).toBeInTheDocument();
  });

  it('renders scopes and tools together as list items', () => {
    render(
      <MixedScopesBanner
        otherAppliedScopes={{ scopes: ['Agent'], tools: ['Tool B'] }}
        labels={labels}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Agent', 'Tool B']);
  });

  it('renders the header and the save-as-new hint', () => {
    render(
      <MixedScopesBanner otherAppliedScopes={{ scopes: ['Agent'], tools: [] }} labels={labels} />
    );

    expect(screen.getByText('This guardrail is also applied to:')).toBeInTheDocument();
    expect(
      screen.getByText('Use "Save as new" to create a separate copy for this tool only.')
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MixedScopesBanner
        otherAppliedScopes={{ scopes: ['Agent'], tools: ['Tool B'] }}
        labels={labels}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
