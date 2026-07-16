import { i18n } from '@lingui/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider, type SupportedLocale } from '../../../i18n';
import { FormattingToolbar } from './FormattingToolbar';
import type { ActiveFormats } from './markdown-formatting';

const defaultFormats: ActiveFormats = {
  bold: false,
  italic: false,
  strikethrough: false,
  bulletList: false,
  numberedList: false,
};

function createMockTextArea(value = '', selectionStart = 0, selectionEnd = 0) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.selectionStart = selectionStart;
  textarea.selectionEnd = selectionEnd;
  document.body.appendChild(textarea);
  textarea.focus();
  return { current: textarea };
}

function renderWithI18n(ui: React.ReactElement, locale: SupportedLocale = 'en') {
  return render(
    <ApI18nProvider component="canvas" locale={locale}>
      {ui}
    </ApI18nProvider>
  );
}

describe('FormattingToolbar', () => {
  it('calls onFormat when a button is clicked', () => {
    const onFormat = vi.fn();
    const ref = createMockTextArea('hello world', 6, 11);

    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={onFormat}
      />
    );

    // Click the first button (bold)
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onFormat).toHaveBeenCalledWith(expect.objectContaining({ value: 'hello **world**' }));

    ref.current.remove();
  });

  it('does not call onFormat when textAreaRef is null', () => {
    const onFormat = vi.fn();
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;

    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={onFormat}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onFormat).not.toHaveBeenCalled();
  });

  it('exposes the container as an accessible toolbar', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;
    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
      />
    );

    expect(screen.getByRole('toolbar', { name: /Text formatting/i })).toBeTruthy();
  });

  it('exposes an accessible name on every toolbar button', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;
    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
      />
    );

    // All five icon-only buttons must resolve via accessible name so screen
    // readers announce them. Shortcut text comes from ICU interpolation — if
    // that breaks, these queries surface the regression.
    expect(screen.getByRole('button', { name: /^Bold \(.+\+B\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Italic \(.+\+I\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Strikethrough \(.+X\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Bullet list$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Numbered list$/ })).toBeTruthy();
  });

  it('renders translated labels when a non-English locale is active', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;

    // Load a fake Spanish catalog with translations for the toolbar keys
    i18n.load('es', {
      'sticky-note.formatting.bold': ['Negrita (', ['boldShortcut'], ')'],
      'sticky-note.formatting.italic': ['Cursiva (', ['italicShortcut'], ')'],
      'sticky-note.formatting.strikethrough': ['Tachado (', ['strikethroughShortcut'], ')'],
      'sticky-note.formatting.bullet-list': ['Lista con viñetas'],
      'sticky-note.formatting.numbered-list': ['Lista numerada'],
      'sticky-note.formatting.toolbar': ['Formato de texto'],
    });

    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
      />,
      'es'
    );

    expect(screen.getByRole('toolbar', { name: 'Formato de texto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Negrita \(.+\+B\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cursiva \(.+\+I\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Tachado \(.+X\)$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Lista con viñetas$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Lista numerada$/ })).toBeTruthy();
  });

  it('prevents textarea blur on mousedown', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;
    const { container } = renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
      />
    );

    const toolbarContainer = container.querySelector('[class]') as HTMLElement;
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const prevented = !toolbarContainer.dispatchEvent(mouseDownEvent);
    expect(prevented).toBe(true);
  });

  it('disables custom actions when no action handler is available', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;

    renderWithI18n(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
        actions={[
          {
            id: 'embed-media',
            label: 'Embed media',
            icon: <span aria-hidden="true">M</span>,
            onAction: vi.fn(),
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Embed media' })).toBeDisabled();
  });
});
