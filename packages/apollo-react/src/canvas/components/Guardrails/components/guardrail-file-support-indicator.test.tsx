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

  describe('warning section', () => {
    const UNINSPECTED =
      'Not inspected yet: PDF, images, Office documents, HTML. Files of these kinds attached to a run pass this guardrail without being checked.';
    const VISION = 'Read only when the selected model supports images: PDF, images.';
    const warningSlot = (container: HTMLElement) =>
      container.querySelector('[data-slot="guardrail-file-support-warning"]');

    it('names the uninspected kinds in display order, not payload order', () => {
      const { container } = render(
        <GuardrailFileSupportIndicator
          fileSupport={{
            supported: true,
            formats: ['Text'],
            uninspectedFormats: ['Html', 'Office', 'Image', 'Pdf'],
          }}
        />
      );

      expect(screen.getByText('Reads file contents (text)')).toBeInTheDocument();
      expect(warningSlot(container)).toHaveTextContent(UNINSPECTED);
    });

    it('carries the vision sentence alone', () => {
      const { container } = render(
        <GuardrailFileSupportIndicator
          fileSupport={{
            supported: true,
            formats: ['Text', 'Pdf', 'Image'],
            visionModelFormats: ['Image', 'Pdf'],
          }}
        />
      );

      expect(warningSlot(container)?.textContent).toBe(VISION);
    });

    it('carries both sentences, uninspected first', () => {
      const { container } = render(
        <GuardrailFileSupportIndicator
          fileSupport={{
            supported: true,
            formats: ['Text', 'Pdf', 'Image'],
            uninspectedFormats: ['Office', 'Html'],
            visionModelFormats: ['Pdf', 'Image'],
          }}
        />
      );

      expect(warningSlot(container)?.textContent).toBe(
        `Not inspected yet: Office documents, HTML. Files of these kinds attached to a run pass this guardrail without being checked. ${VISION}`
      );
    });

    it('is a polite status region', () => {
      render(
        <GuardrailFileSupportIndicator
          fileSupport={{ supported: true, formats: ['Text'], uninspectedFormats: ['Pdf'] }}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Not inspected yet: PDF.');
    });

    const noWarningCases: [string, GuardrailFileSupport][] = [
      ['absent', { supported: true, formats: ['Text'] }],
      [
        'empty',
        { supported: true, formats: ['Text'], uninspectedFormats: [], visionModelFormats: [] },
      ],
      [
        'unsupported',
        {
          supported: false,
          formats: [],
          unavailableReason: 'NotEnabled',
          uninspectedFormats: ['Pdf'],
          visionModelFormats: ['Image'],
        },
      ],
    ];

    it.each(noWarningCases)('renders no warning when %s', (_, fileSupport) => {
      const { container } = render(<GuardrailFileSupportIndicator fileSupport={fileSupport} />);

      expect(warningSlot(container)).toBeNull();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(container.firstElementChild).toHaveAttribute('data-slot', 'guardrail-file-support');
    });

    it('takes overrides for both sentences', () => {
      const { container } = render(
        <GuardrailFileSupportIndicator
          fileSupport={{
            supported: true,
            formats: ['Text'],
            uninspectedFormats: ['Pdf'],
            visionModelFormats: ['Image'],
          }}
          labels={{
            uninspectedFormats: 'Skipped: {{formats}}.',
            visionModelFormats: 'Vision only: {{formats}}.',
          }}
        />
      );

      expect(warningSlot(container)?.textContent).toBe('Skipped: PDF. Vision only: images.');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <GuardrailFileSupportIndicator
          fileSupport={{
            supported: true,
            formats: ['Text', 'Pdf', 'Image'],
            uninspectedFormats: ['Office', 'Html'],
            visionModelFormats: ['Pdf', 'Image'],
          }}
        />
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailFileSupportIndicator fileSupport={{ supported: true, formats: ['Text'] }} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
