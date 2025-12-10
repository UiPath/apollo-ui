import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';
import { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from './ApTypography';

describe('ApTypography', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<ApTypography>Hello World</ApTypography>);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<ApTypography>Test</ApTypography>);
      const element = screen.getByText('Test');
      expect(element).toBeInTheDocument();
    });

    it('renders with specified variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeL}>
          Large Text
        </ApTypography>
      );
      expect(screen.getByText('Large Text')).toBeInTheDocument();
    });
  });

  describe('Heading Variants', () => {
    it('renders h1 for fontSizeH1 variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeH1}>
          Heading 1
        </ApTypography>
      );
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('renders h2 for fontSizeH2 variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeH2}>
          Heading 2
        </ApTypography>
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('renders h3 for fontSizeH3 variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeH3}>
          Heading 3
        </ApTypography>
      );
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('renders h4 for fontSizeH4 variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeH4}>
          Heading 4
        </ApTypography>
      );
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
    });

    it('renders h1 for hero variants', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeHero}>
          Hero Text
        </ApTypography>
      );
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('Body Text Variants', () => {
    it('renders p tag for large body text', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeL}>
          Body Large
        </ApTypography>
      );
      const element = screen.getByText('Body Large');
      expect(element.tagName).toBe('P');
    });

    it('renders span for medium body text', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeM}>
          Body Medium
        </ApTypography>
      );
      const element = screen.getByText('Body Medium');
      expect(element.tagName).toBe('SPAN');
    });

    it('renders span for small text', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeS}>
          Small Text
        </ApTypography>
      );
      const element = screen.getByText('Small Text');
      expect(element.tagName).toBe('SPAN');
    });
  });

  describe('Monospace Variants', () => {
    it('renders code tag for monospace variants', () => {
      render(
        <ApTypography variant={FontVariantToken.fontMonoM}>
          Code Text
        </ApTypography>
      );
      const element = screen.getByText('Code Text');
      expect(element.tagName).toBe('CODE');
    });
  });

  describe('Color Prop', () => {
    it('accepts custom color prop', () => {
      render(
        <ApTypography color="#FF5722">
          Colored Text
        </ApTypography>
      );
      const element = screen.getByText('Colored Text');
      expect(element).toBeInTheDocument();
    });

    it('accepts CSS variable color prop', () => {
      render(
        <ApTypography color="var(--color-primary)">
          Variable Color
        </ApTypography>
      );
      const element = screen.getByText('Variable Color');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Display Prop', () => {
    it('applies block display', () => {
      render(
        <ApTypography display="block">
          Block Text
        </ApTypography>
      );
      const element = screen.getByText('Block Text');
      expect(element).toHaveStyle({ display: 'block' });
    });

    it('applies inline display', () => {
      render(
        <ApTypography display="inline">
          Inline Text
        </ApTypography>
      );
      const element = screen.getByText('Inline Text');
      expect(element).toHaveStyle({ display: 'inline' });
    });

    it('applies inline-block display', () => {
      render(
        <ApTypography display="inline-block">
          Inline Block Text
        </ApTypography>
      );
      const element = screen.getByText('Inline Block Text');
      expect(element).toHaveStyle({ display: 'inline-block' });
    });
  });

  describe('Align Prop', () => {
    it('applies center alignment', () => {
      render(
        <ApTypography align="center">
          Centered Text
        </ApTypography>
      );
      const element = screen.getByText('Centered Text');
      expect(element).toHaveStyle({ textAlign: 'center' });
    });

    it('applies left alignment', () => {
      render(
        <ApTypography align="left">
          Left Text
        </ApTypography>
      );
      const element = screen.getByText('Left Text');
      expect(element).toHaveStyle({ textAlign: 'left' });
    });

    it('applies right alignment', () => {
      render(
        <ApTypography align="right">
          Right Text
        </ApTypography>
      );
      const element = screen.getByText('Right Text');
      expect(element).toHaveStyle({ textAlign: 'right' });
    });

    it('applies justify alignment', () => {
      render(
        <ApTypography align="justify">
          Justified Text
        </ApTypography>
      );
      const element = screen.getByText('Justified Text');
      expect(element).toHaveStyle({ textAlign: 'justify' });
    });
  });

  describe('MUI Props Pass-through', () => {
    it('passes className prop', () => {
      render(
        <ApTypography className="custom-class">
          Custom Class
        </ApTypography>
      );
      const element = screen.getByText('Custom Class');
      expect(element).toHaveClass('custom-class');
    });

    it('passes data attributes', () => {
      render(
        <ApTypography data-testid="custom-typography">
          Test ID
        </ApTypography>
      );
      expect(screen.getByTestId('custom-typography')).toBeInTheDocument();
    });

    it('accepts sx prop', () => {
      render(
        <ApTypography sx={{ marginTop: 2 }}>
          SX Prop
        </ApTypography>
      );
      const element = screen.getByText('SX Prop');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Typography Tokens', () => {
    it('renders with Apollo typography variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeM}>
          Token Text
        </ApTypography>
      );
      const element = screen.getByText('Token Text');
      expect(element).toBeInTheDocument();
      // Verify it's a span (correct component for M variant)
      expect(element.tagName).toBe('SPAN');
    });

    it('renders heading with correct variant', () => {
      render(
        <ApTypography variant={FontVariantToken.fontSizeH1}>
          Large Heading
        </ApTypography>
      );
      const element = screen.getByText('Large Heading');
      expect(element).toBeInTheDocument();
      // Verify it's an h1
      expect(element.tagName).toBe('H1');
    });
  });

  describe('Custom Styling', () => {
    it('merges custom sx with component styles', () => {
      render(
        <ApTypography
          variant={FontVariantToken.fontSizeM}
          sx={{ padding: '10px', marginBottom: '20px' }}
        >
          Custom Styled
        </ApTypography>
      );
      const element = screen.getByText('Custom Styled');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Component Override', () => {
    it('allows component override via prop', () => {
      render(
        <ApTypography component="div">
          Div Component
        </ApTypography>
      );
      const element = screen.getByText('Div Component');
      expect(element.tagName).toBe('DIV');
    });
  });
});
