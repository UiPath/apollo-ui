import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField, FormFieldDescription, FormFieldError, FormFieldLabel } from './form-field';

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
});
