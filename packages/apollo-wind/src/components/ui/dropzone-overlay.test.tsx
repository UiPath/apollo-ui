import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DropzoneOverlay, type DropzoneOverlayProps } from './dropzone-overlay';

function setup(props: Partial<DropzoneOverlayProps> = {}) {
  const onFiles = vi.fn();
  render(
    <DropzoneOverlay data-testid="zone" onFiles={onFiles} {...props}>
      <p>Conversation</p>
    </DropzoneOverlay>
  );
  return { zone: screen.getByTestId('zone'), onFiles };
}

const fileTransfer = (files: File[] = []) => ({ dataTransfer: { types: ['Files'], files } });
const pdf = new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });
const png = new File(['png'], 'chart.png', { type: 'image/png' });

describe('DropzoneOverlay', () => {
  it('shows the overlay on dragenter and hides it on dragleave', () => {
    const { zone } = setup();

    fireEvent.dragEnter(zone, fileTransfer());
    expect(screen.getByText('Drop files to attach')).toBeInTheDocument();
    expect(zone).toHaveAttribute('data-dragging');

    fireEvent.dragLeave(zone, fileTransfer());
    expect(screen.queryByText('Drop files to attach')).not.toBeInTheDocument();
  });

  it('stays visible while the drag crosses child elements', () => {
    const { zone } = setup();
    const child = screen.getByText('Conversation');

    fireEvent.dragEnter(zone, fileTransfer());
    fireEvent.dragEnter(child, fileTransfer());
    fireEvent.dragLeave(zone, fileTransfer());

    expect(screen.getByText('Drop files to attach')).toBeInTheDocument();
  });

  it('ignores drags that carry no files', () => {
    const { zone } = setup();
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['text/plain'], files: [] } });
    expect(screen.queryByText('Drop files to attach')).not.toBeInTheDocument();
  });

  it('hides the overlay and reports accepted files on drop', () => {
    const { zone, onFiles } = setup();

    fireEvent.dragEnter(zone, fileTransfer());
    fireEvent.drop(zone, fileTransfer([pdf, png]));

    expect(screen.queryByText('Drop files to attach')).not.toBeInTheDocument();
    expect(onFiles).toHaveBeenCalledWith([pdf, png], []);
  });

  it('leaves a drop the consumer handled, but still hides the overlay', () => {
    const { zone, onFiles } = setup({ onDrop: (event) => event.preventDefault() });

    fireEvent.dragEnter(zone, fileTransfer());
    fireEvent.drop(zone, fileTransfer([pdf]));

    expect(screen.queryByText('Drop files to attach')).not.toBeInTheDocument();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('rejects files of the wrong type', () => {
    const { zone, onFiles } = setup({ accept: 'image/*' });
    fireEvent.drop(zone, fileTransfer([pdf, png]));
    expect(onFiles).toHaveBeenCalledWith([png], [{ file: pdf, reason: 'type' }]);
  });

  it('accepts extensions and lists for accept', () => {
    const { zone, onFiles } = setup({ accept: ['.pdf'] });
    fireEvent.drop(zone, fileTransfer([pdf, png]));
    expect(onFiles).toHaveBeenCalledWith([pdf], [{ file: png, reason: 'type' }]);
  });

  it('rejects files over maxSize', () => {
    const big = new File(['x'.repeat(20)], 'big.txt', { type: 'text/plain' });
    const small = new File(['x'], 'small.txt', { type: 'text/plain' });
    const { zone, onFiles } = setup({ maxSize: 10 });
    fireEvent.drop(zone, fileTransfer([big, small]));
    expect(onFiles).toHaveBeenCalledWith([small], [{ file: big, reason: 'size' }]);
  });

  it('rejects files past maxFiles', () => {
    const { zone, onFiles } = setup({ maxFiles: 1 });
    fireEvent.drop(zone, fileTransfer([pdf, png]));
    expect(onFiles).toHaveBeenCalledWith([pdf], [{ file: png, reason: 'count' }]);
  });

  it('does nothing while disabled', () => {
    const { zone, onFiles } = setup({ disabled: true });
    fireEvent.dragEnter(zone, fileTransfer());
    fireEvent.drop(zone, fileTransfer([pdf]));
    expect(screen.queryByText('Drop files to attach')).not.toBeInTheDocument();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('takes pasted files when enablePaste is set', () => {
    const { zone, onFiles } = setup({ enablePaste: true });
    fireEvent.paste(zone, { clipboardData: { files: [png], items: [] } });
    expect(onFiles).toHaveBeenCalledWith([png], []);
  });

  it('ignores pastes without enablePaste, or without files', () => {
    const { zone, onFiles } = setup();
    fireEvent.paste(zone, { clipboardData: { files: [png], items: [] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('takes overridden strings', () => {
    const { zone } = setup({ strings: { dropHint: 'Dateien hier ablegen' } });
    fireEvent.dragEnter(zone, fileTransfer());
    expect(screen.getByText('Dateien hier ablegen')).toBeInTheDocument();
  });

  it('has no axe violations while dragging', async () => {
    const { zone } = setup();
    fireEvent.dragEnter(zone, fileTransfer());
    expect(await axe(zone)).toHaveNoViolations();
  });
});
