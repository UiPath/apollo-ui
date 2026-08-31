import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { Label, RequiredIndicator } from './label';

describe('Label', () => {
  it('renders label with text', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="username">
          Username
          <RequiredIndicator />
        </Label>
        <Input id="username" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies the default treatment', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toHaveClass('text-xs', 'font-medium', 'text-foreground');
  });

  it('applies the muted treatment for labels that name a single option', () => {
    render(<Label variant="muted">Email me updates</Label>);
    expect(screen.getByText('Email me updates')).toHaveClass(
      'text-xs',
      'font-normal',
      'text-foreground-muted'
    );
  });

  it('keeps both variants on one type scale', () => {
    const { rerender } = render(<Label>Label</Label>);
    expect(screen.getByText('Label')).toHaveClass('text-xs');
    rerender(<Label variant="muted">Label</Label>);
    expect(screen.getByText('Label')).toHaveClass('text-xs');
  });

  it('exposes the variant so consumers can target it', () => {
    const { rerender } = render(<Label>Endpoint</Label>);
    expect(screen.getByText('Endpoint')).toHaveAttribute('data-variant', 'default');
    rerender(<Label variant="muted">Endpoint</Label>);
    expect(screen.getByText('Endpoint')).toHaveAttribute('data-variant', 'muted');
  });

  it('renders children verbatim so callers can truncate the text alone', () => {
    render(
      <Label>
        <span className="truncate">Endpoint</span>
        <RequiredIndicator />
      </Label>
    );

    const text = screen.getByText('Endpoint');
    expect(text).toHaveClass('truncate');
    expect(text).not.toContainElement(screen.getByText('*'));
  });

  it('adds no indicator of its own', () => {
    render(<Label>Email</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('accepts htmlFor attribute', () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });

  it('accepts custom className', () => {
    render(<Label className="custom-label">Custom</Label>);
    expect(screen.getByText('Custom')).toHaveClass('custom-label');
  });

  it('lets callers rename the slot they are targeted by', () => {
    const { container } = render(<Label data-slot="panel-field-label">Email</Label>);
    expect(container.querySelector('[data-slot="panel-field-label"]')).not.toBeNull();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});

describe('RequiredIndicator', () => {
  it('takes the foreground color rather than an error color', () => {
    render(
      <Label htmlFor="name">
        Name
        <RequiredIndicator />
      </Label>
    );
    const indicator = screen.getByText('*').parentElement;
    expect(indicator).toHaveClass('text-foreground');
    expect(indicator).not.toHaveClass('text-destructive');
    expect(indicator).not.toHaveClass('text-error');
  });

  it('hides the asterisk glyph from assistive tech but announces it via sr-only text', () => {
    render(
      <Label htmlFor="name">
        Name
        <RequiredIndicator />
      </Label>
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('(required)')).toHaveClass('sr-only');
  });

  it('lets a localized surface supply its own announced text', () => {
    render(
      <Label htmlFor="name">
        Name
        <RequiredIndicator srLabel="requis" />
      </Label>
    );
    expect(screen.getByText('requis')).toHaveClass('sr-only');
    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
  });

  it('announces the requirement even when the paired control has no required/aria-required', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="name">
          Name
          <RequiredIndicator />
        </Label>
        <Input id="name" />
      </div>
    );
    expect(screen.getByLabelText(/Name\*?\s*\(required\)/)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
