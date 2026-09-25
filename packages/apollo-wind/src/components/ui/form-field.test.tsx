import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldHeader,
  FormFieldLabel,
} from './form-field';
import { TooltipProvider } from './tooltip';

describe('FormField', () => {
  it('composes the field anatomy without any form context', () => {
    render(
      <FormField>
        <FormFieldLabel htmlFor="endpoint" required>
          Endpoint
        </FormFieldLabel>
        <input id="endpoint" />
        <FormFieldDescription>The URL to call.</FormFieldDescription>
        <FormFieldError>Endpoint is required.</FormFieldError>
      </FormField>
    );

    expect(screen.getByLabelText(/Endpoint/)).toBeInTheDocument();
    expect(screen.getByText('The URL to call.')).toBeInTheDocument();
    expect(screen.getByText('Endpoint is required.')).toBeInTheDocument();
  });

  it('pins the column so a truncating control cannot widen the field', () => {
    render(<FormField data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveClass('grid', 'grid-cols-[minmax(0,1fr)]');
  });

  it('lets a consumer override the column template', () => {
    render(<FormField data-testid="field" className="grid-cols-2" />);
    const field = screen.getByTestId('field');
    expect(field).toHaveClass('grid-cols-2');
    expect(field).not.toHaveClass('grid-cols-[minmax(0,1fr)]');
  });

  it("cancels a direct-child message's own margin itself, not via a global stylesheet rule", () => {
    // This class is what makes a validation message rendered as a Fragment sibling of its
    // control (Input, Select, Combobox, ...) show one gap instead of the grid gap and the
    // message's own margin stacking. Keeping the rule here, rather than in a bare
    // `.gap-1\.5` selector in global CSS, is load-bearing: Tailwind compiles a component's
    // own className usage into its layered utilities output, so a consumer's own margin
    // utility can still compete on specificity. An unlayered global rule cannot be
    // outranked by anything in the cascade, regardless of specificity.
    render(<FormField data-testid="field" />);
    expect(screen.getByTestId('field')).toHaveClass('[&>[data-slot=form-field-error]]:mt-0');
  });
});

describe('FormFieldLabel', () => {
  it('appends the required indicator', () => {
    render(<FormFieldLabel required>Endpoint</FormFieldLabel>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('omits the indicator by default', () => {
    render(<FormFieldLabel>Endpoint</FormFieldLabel>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders the info tooltip trigger after the required indicator', () => {
    render(
      <TooltipProvider>
        <FormFieldLabel required tooltip="The URL to call." tooltipAriaLabel="About the endpoint">
          Endpoint
        </FormFieldLabel>
      </TooltipProvider>
    );
    const trigger = screen.getByRole('button', { name: 'About the endpoint' });
    expect(trigger).toBeInTheDocument();
    // Order matters: label text, then the asterisk, then the tooltip trigger.
    expect(screen.getByText('*').compareDocumentPosition(trigger)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    // ...and the trigger must not be a <label> descendant: <button> is labelable, which
    // <label>'s content model forbids and which makes clicking it ambiguous with
    // activating the labelled control.
    expect(trigger.closest('label')).toBeNull();
  });

  it('defaults the tooltip trigger name and renders none without a tooltip', () => {
    const { rerender } = render(
      <TooltipProvider>
        <FormFieldLabel tooltip="The URL to call.">Endpoint</FormFieldLabel>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <FormFieldLabel>Endpoint</FormFieldLabel>
      </TooltipProvider>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('treats a blank tooltip string as no tooltip', () => {
    render(<FormFieldLabel tooltip="  ">Endpoint</FormFieldLabel>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('FormFieldDescription', () => {
  it('matches the label size and muted color', () => {
    render(<FormFieldDescription>The URL to call.</FormFieldDescription>);
    expect(screen.getByText('The URL to call.')).toHaveClass(
      'text-xs',
      'leading-4',
      'text-foreground-muted'
    );
  });

  it('renders nothing without children', () => {
    const { container } = render(<FormFieldDescription />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FormFieldError', () => {
  it('uses the error token and announces politely', () => {
    render(<FormFieldError>Endpoint is required.</FormFieldError>);
    const error = screen.getByText('Endpoint is required.');
    expect(error).toHaveClass('text-xs', 'leading-4', 'text-error');
    expect(error).toHaveAttribute('aria-live', 'polite');
  });

  it('renders nothing without children', () => {
    const { container } = render(<FormFieldError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('carries its own top margin standalone, and the canonical data-slot even if overridden', () => {
    render(<FormFieldError data-slot="something-else">Required.</FormFieldError>);
    const error = screen.getByText('Required.');
    expect(error).toHaveClass('mt-1.5');
    expect(error).toHaveAttribute('data-slot', 'form-field-error');
  });
});

describe('FormFieldHeader', () => {
  it('renders nothing when it has no label, leading or actions', () => {
    const { container } = render(<FormFieldHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is the container its actions collapse by, with a forwarded ref and extra props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<FormFieldHeader ref={ref} label="Summary" data-testid="header" />);
    const header = screen.getByTestId('header');
    expect(ref.current).toBe(header);
    expect(header).toHaveClass('@container');
  });

  it('marks a required field with an asterisk in the label’s own colour', () => {
    render(<FormFieldHeader label="Summary" required />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    const marker = screen.getByText('*');
    // The marker reads as part of the label, not as a warning about it.
    expect(marker.className).not.toMatch(/error|destructive/);
  });

  it('never recolours the label, whatever state the field is in', () => {
    render(<FormFieldHeader label="Summary" />);
    const label = screen.getByText('Summary').closest('label') as HTMLElement;
    expect(label.className).not.toMatch(/error|destructive/);
  });

  it('keeps the type annotation AFTER the label and the glyph before it', () => {
    render(
      <FormFieldHeader label="Body" leading={<span>glyph</span>} badge={<span>string</span>} />
    );

    const label = screen.getByText('Body');
    expect(label.compareDocumentPosition(screen.getByText('glyph'))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );
    expect(label.compareDocumentPosition(screen.getByText('string'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('renders nothing for a badge or glyph alone', () => {
    const { container } = render(
      <FormFieldHeader badge={<span>number</span>} leading={<span>glyph</span>} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('carries the passengers once the label opens the row', () => {
    render(<FormFieldHeader label="Body" badge={<span>number</span>} />);
    expect(screen.getByText('number')).toBeInTheDocument();
  });

  it('renders leading and action slots', () => {
    render(
      <FormFieldHeader
        label="Body"
        leading={<span>badge</span>}
        actions={<button type="button">Insert</button>}
      />
    );

    expect(screen.getByText('badge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert' })).toBeInTheDocument();
  });

  it('opens the description from the info trigger beside the label', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <FormFieldHeader label="Timeout" tooltip="How long to wait" />
      </TooltipProvider>
    );

    // A real button, so the description reaches keyboard and touch as well as hover.
    await user.tab();
    expect(screen.getByRole('button', { name: 'More information' })).toHaveFocus();
    expect(await screen.findAllByText('How long to wait')).not.toHaveLength(0);
  });

  it('draws no info trigger for blank description text', () => {
    render(<FormFieldHeader label="Timeout" tooltip="   " />);
    expect(screen.queryByRole('button', { name: 'More information' })).toBeNull();
  });

  it('names the field with FormFieldLabel, so it stacks inside FormField like any label', () => {
    render(
      <FormField>
        <FormFieldHeader
          label="Timeout"
          htmlFor="timeout"
          actions={<button type="button">Insert</button>}
        />
        <input id="timeout" />
      </FormField>
    );

    expect(screen.getByText('Timeout').closest('label')).toHaveAttribute(
      'data-slot',
      'form-field-label'
    );
    expect(screen.getByLabelText('Timeout')).toBeInTheDocument();
  });
});
