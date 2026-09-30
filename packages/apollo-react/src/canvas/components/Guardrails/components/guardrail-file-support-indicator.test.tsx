import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import type { GuardrailFileSupport } from '../builder-types';
import { GuardrailFileSupportIndicator } from './guardrail-file-support-indicator';

/**
 * Every case here drives the component from data alone. That is the point of the component:
 * which validator reads which file kinds is the host's answer, so nothing in here may branch on
 * a validator name, and no test may need one to reach a state.
 */
describe('GuardrailFileSupportIndicator', () => {
  it('renders nothing when the host said nothing about files', () => {
    const { container } = render(<GuardrailFileSupportIndicator />);

    expect(container).toBeEmptyDOMElement();
  });

  it('names the formats it was given', () => {
    const fileSupport: GuardrailFileSupport = {
      supported: true,
      formats: ['Text', 'Pdf', 'Image'],
    };

    render(<GuardrailFileSupportIndicator fileSupport={fileSupport} />);

    expect(screen.getByText('Reads file contents (text, PDF, images)')).toBeInTheDocument();
  });

  it('names formats in display order, not payload order', () => {
    render(
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: true, formats: ['Html', 'Image', 'Text', 'Office', 'Pdf'] }}
      />
    );

    expect(
      screen.getByText('Reads file contents (text, PDF, images, Office documents, HTML)')
    ).toBeInTheDocument();
  });

  it('still says files are read when the host named no formats', () => {
    render(<GuardrailFileSupportIndicator fileSupport={{ supported: true, formats: [] }} />);

    expect(screen.getByText('Reads file contents')).toBeInTheDocument();
  });

  it('says text only when this validator reads no files', () => {
    render(
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: false, formats: [], unavailableReason: 'NotEnabled' }}
      />
    );

    expect(screen.getByText('Text prompts only')).toBeInTheDocument();
  });

  it('distinguishes an environment that forwards no files at all', () => {
    render(
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: false, formats: [], unavailableReason: 'AutomationSuite' }}
      />
    );

    expect(
      screen.getByText('Text prompts only (files are not available in this environment)')
    ).toBeInTheDocument();
  });

  it('falls back to the plain unsupported wording when no reason was given', () => {
    render(<GuardrailFileSupportIndicator fileSupport={{ supported: false, formats: [] }} />);

    expect(screen.getByText('Text prompts only')).toBeInTheDocument();
  });

  it('takes per-string label overrides', () => {
    render(
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: true, formats: ['Pdf'] }}
        labels={{ supportedFormats: 'Inspects {{formats}}' }}
      />
    );

    expect(screen.getByText('Inspects PDF')).toBeInTheDocument();
  });

  it('keeps the format names it was not given when one is overridden', () => {
    // `formats` is a nested record, so a shallow label merge would drop the other four.
    render(
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: true, formats: ['Text', 'Pdf'] }}
        labels={{ formats: { Pdf: 'PDF files' } }}
      />
    );

    expect(screen.getByText('Reads file contents (text, PDF files)')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailFileSupportIndicator fileSupport={{ supported: true, formats: ['Text'] }} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
