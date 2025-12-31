import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { FileUpload } from './file-upload';

// Helper to create mock files
function createMockFile(name: string, size: number, type: string): File {
  const file = new File(['x'.repeat(size)], name, { type });
  return file;
}

describe('FileUpload', () => {
  describe('rendering', () => {
    it('renders upload zone', () => {
      render(<FileUpload />);
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('renders file input (hidden)', () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
    });

    it('renders accept types when provided', () => {
      render(<FileUpload accept=".pdf,.doc" />);
      expect(screen.getByText('.pdf, .doc')).toBeInTheDocument();
    });

    it('renders max size when provided', () => {
      render(<FileUpload maxSize={5242880} />);
      expect(screen.getByText(/Max size: 5 MB/)).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      const { container } = render(<FileUpload disabled />);
      expect(container.querySelector('.opacity-50')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FileUpload />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with files uploaded', async () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('test.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('file selection', () => {
    it('handles file input change', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload onFilesChange={handleChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.txt', 100, 'text/plain');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([file]);
      });
    });

    it('displays uploaded file name', async () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });

    it('displays file size', async () => {
      const { container } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('test.txt', 1024, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('1 KB')).toBeInTheDocument();
      });
    });

    it('handles multiple files when multiple prop is true', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload multiple onFilesChange={handleChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = createMockFile('file1.txt', 100, 'text/plain');
      const file2 = createMockFile('file2.txt', 200, 'text/plain');

      fireEvent.change(input, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument();
        expect(screen.getByText('file2.txt')).toBeInTheDocument();
      });
    });

    it('replaces file when multiple is false', async () => {
      const { container } = render(<FileUpload multiple={false} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createMockFile('first.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file1] } });

      await waitFor(() => {
        expect(screen.getByText('first.txt')).toBeInTheDocument();
      });

      const file2 = createMockFile('second.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file2] } });

      await waitFor(() => {
        expect(screen.getByText('second.txt')).toBeInTheDocument();
        expect(screen.queryByText('first.txt')).not.toBeInTheDocument();
      });
    });
  });

  describe('file removal', () => {
    it('removes file when remove button is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { container } = render(<FileUpload onFilesChange={handleChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove test\.txt/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      });
      expect(handleChange).toHaveBeenLastCalledWith([]);
    });
  });

  describe('file validation', () => {
    it('shows error for files exceeding maxSize', async () => {
      const { container } = render(<FileUpload maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument();
      });
    });

    it('does not add invalid files to list', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload maxSize={100} onFilesChange={handleChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByText('large.txt')).not.toBeInTheDocument();
      });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('drag and drop', () => {
    it('shows drag state on drag enter', () => {
      const { container } = render(<FileUpload />);
      const dropzone = container.querySelector('.border-dashed') as HTMLElement;

      fireEvent.dragEnter(dropzone, {
        dataTransfer: { files: [] },
      });

      expect(dropzone).toHaveClass('border-primary');
    });

    it('removes drag state on drag leave', () => {
      const { container } = render(<FileUpload />);
      const dropzone = container.querySelector('.border-dashed') as HTMLElement;

      fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
      fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });

      expect(dropzone).not.toHaveClass('border-primary');
    });

    it('handles file drop', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload onFilesChange={handleChange} />);
      const dropzone = container.querySelector('.border-dashed') as HTMLElement;

      const file = createMockFile('dropped.txt', 100, 'text/plain');
      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
        types: ['Files'],
      };

      fireEvent.drop(dropzone, { dataTransfer });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([file]);
      });
    });

    it('does not handle drop when disabled', () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload disabled onFilesChange={handleChange} />);
      const dropzone = container.querySelector('.border-dashed') as HTMLElement;

      const file = createMockFile('dropped.txt', 100, 'text/plain');
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<FileUpload className="custom-upload" />);
      expect(container.firstChild).toHaveClass('custom-upload');
    });
  });

  describe('accept prop', () => {
    it('passes accept to input element', () => {
      const { container } = render(<FileUpload accept="image/*" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'image/*');
    });
  });
});
