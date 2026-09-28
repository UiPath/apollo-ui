import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApRichTextEditor } from './ApRichTextEditor';

const TOOLBAR_CONTROLS = [
  'Format bold',
  'Format italic',
  'Format underline',
  'Format strikethrough',
  'Format unordered list',
  'Format ordered list',
  'Insert link',
  'Format code',
];

describe('ApRichTextEditor', () => {
  describe('Basic rendering', () => {
    it('renders the label', () => {
      render(<ApRichTextEditor label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders the formatting toolbar with all controls', () => {
      render(<ApRichTextEditor label="RTE" />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      for (const name of TOOLBAR_CONTROLS) {
        expect(screen.getByLabelText(name)).toBeInTheDocument();
      }
    });

    it('renders an editable area by default', () => {
      const { container } = render(<ApRichTextEditor label="RTE" />);
      expect(container.querySelector('.editor-input')).toHaveAttribute('contenteditable', 'true');
    });

    it('renders the placeholder text', () => {
      render(<ApRichTextEditor label="RTE" placeholder="Type here" />);
      expect(screen.getByText('Type here')).toBeInTheDocument();
    });

    it('renders the initial markdown content', async () => {
      render(<ApRichTextEditor label="RTE" initialContent="Hello world" />);
      expect(await screen.findByText('Hello world')).toBeInTheDocument();
    });
  });

  describe('Label states', () => {
    it('adds an asterisk when required', () => {
      render(<ApRichTextEditor label="Name" required />);
      expect(screen.getByText(/Name/).textContent).toContain('*');
    });

    it('does not add an asterisk when not required', () => {
      render(<ApRichTextEditor label="Name" />);
      expect(screen.getByText('Name').textContent).not.toContain('*');
    });

    it('renders helper text', () => {
      render(<ApRichTextEditor label="RTE" helperText="Helpful hint" />);
      expect(screen.getByText('Helpful hint')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders the error message', () => {
      render(<ApRichTextEditor label="RTE" error errorMessage="Required field" />);
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });

    it('applies the error class to the container', () => {
      const { container } = render(<ApRichTextEditor label="RTE" error errorMessage="Oops" />);
      expect(container.querySelector('.editor-container.error')).toBeInTheDocument();
    });

    it('falls back to helperText as the error message when only error is set', () => {
      render(<ApRichTextEditor label="RTE" error helperText="This is required" />);
      expect(screen.getByText('This is required')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('applies the disabled class to the container', () => {
      const { container } = render(<ApRichTextEditor label="RTE" disabled />);
      expect(container.querySelector('.editor-container.disabled')).toBeInTheDocument();
    });

    it('disables the toolbar controls', () => {
      render(<ApRichTextEditor label="RTE" disabled />);
      for (const name of TOOLBAR_CONTROLS) {
        expect(screen.getByLabelText(name)).toBeDisabled();
      }
    });

    it('renders a non-editable area when disabled', () => {
      const { container } = render(<ApRichTextEditor label="RTE" disabled />);
      expect(container.querySelector('.editor-input')).toHaveAttribute('contenteditable', 'false');
    });
  });

  describe('Loading state', () => {
    it('shows the loading spinner', () => {
      render(<ApRichTextEditor label="RTE" loading />);
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('applies the loading class and renders no editable area', () => {
      const { container } = render(<ApRichTextEditor label="RTE" loading />);
      expect(container.querySelector('.editor-container.loading')).toBeInTheDocument();
      expect(container.querySelector('.editor-input')).not.toBeInTheDocument();
    });
  });

  describe('Change handlers', () => {
    // Lexical drives content changes through `beforeinput` events, which happy-dom
    // does not faithfully emulate, so editing is exercised in the playground/e2e
    // rather than here. This just verifies the editor mounts with the handlers wired.
    it('renders with change handlers without throwing', () => {
      const onMarkdownChange = vi.fn();
      const onHtmlChange = vi.fn();
      const { container } = render(
        <ApRichTextEditor
          label="RTE"
          initialContent="Hello world"
          onMarkdownChange={onMarkdownChange}
          onHtmlChange={onHtmlChange}
        />
      );
      expect(container.querySelector('.editor-input')).toBeInTheDocument();
    });
  });

  describe('HTML input format', () => {
    it('renders content seeded from HTML', async () => {
      render(
        <ApRichTextEditor label="RTE" inputFormat="html" initialContent="<p>Seeded from HTML</p>" />
      );
      expect(await screen.findByText('Seeded from HTML')).toBeInTheDocument();
    });
  });
});
