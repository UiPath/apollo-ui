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

      const removeButton = screen.getByRole('button', {
        name: /remove test\.txt/i,
      });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      });
      expect(handleChange).toHaveBeenLastCalledWith([]);
    });

    it('allows re-selecting the same file after removal (input reset bug fix)', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { container } = render(<FileUpload onFilesChange={handleChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.txt', 100, 'text/plain');

      // Select file first time
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Remove the file
      const removeButton = screen.getByRole('button', {
        name: /remove test\.txt/i,
      });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      });

      // Verify input value was reset
      expect(input.value).toBe('');

      // Select the same file again
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Verify the callback was called twice (once for first selection, once for re-selection)
      expect(handleChange).toHaveBeenCalledTimes(3); // First add, remove, second add
      expect(handleChange).toHaveBeenLastCalledWith([file]);
    });
  });

  describe('file validation', () => {
    it('shows error for files exceeding maxSize', async () => {
      const { container } = render(<FileUpload maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
    });

    it('adds invalid files to list with error message', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload maxSize={100} onFilesChange={handleChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('large.txt')).toBeInTheDocument();
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
      expect(handleChange).toHaveBeenCalledWith([file]);
    });

    it('prevents duplicate files from being added (deduplication bug fix)', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload multiple onFilesChange={handleChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('test.txt', 100, 'text/plain');

      // Select file first time
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Try to select the same file again (without removing it)
      fireEvent.change(input, { target: { files: [file] } });

      // File should still appear only once in the list
      await waitFor(() => {
        const fileElements = screen.getAllByText('test.txt');
        expect(fileElements).toHaveLength(1);
      });

      // onFilesChange should be called only once (for the first selection)
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith([file]);
    });

    it('allows different files with same name but different size', async () => {
      const handleChange = vi.fn();
      const { container } = render(<FileUpload multiple onFilesChange={handleChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createMockFile('test.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file1] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Create a different file with same name but different size
      const file2 = createMockFile('test.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file2] } });

      // Both files should be in the list (different sizes = different files)
      await waitFor(() => {
        const fileElements = screen.getAllByText('test.txt');
        expect(fileElements).toHaveLength(2);
      });

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenLastCalledWith([file1, file2]);
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

  describe('file type validation', () => {
    it('shows error for file with wrong MIME type', async () => {
      const { container } = render(<FileUpload accept="image/*" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.pdf', 100, 'application/pdf');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.getByText('File type not accepted')).toBeInTheDocument();
      });
    });

    it('accepts file with matching MIME wildcard', async () => {
      const { container } = render(<FileUpload accept="image/*" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('photo.png', 100, 'image/png');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('photo.png')).toBeInTheDocument();
        expect(screen.queryByText('File type not accepted')).not.toBeInTheDocument();
      });
    });

    it('accepts file with matching exact MIME type', async () => {
      const { container } = render(<FileUpload accept="application/pdf" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.pdf', 100, 'application/pdf');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.queryByText('File type not accepted')).not.toBeInTheDocument();
      });
    });

    it('accepts file with matching extension', async () => {
      const { container } = render(<FileUpload accept=".pdf,.doc" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.pdf', 100, 'application/pdf');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.queryByText('File type not accepted')).not.toBeInTheDocument();
      });
    });

    it('rejects file with non-matching extension', async () => {
      const { container } = render(<FileUpload accept=".pdf" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.txt')).toBeInTheDocument();
        expect(screen.getByText('File type not accepted')).toBeInTheDocument();
      });
    });
  });

  describe('external errors prop', () => {
    it('displays external error for a file by filename', async () => {
      const { container, rerender } = render(<FileUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('document.pdf', 100, 'application/pdf');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });

      // Set external error via props
      rerender(<FileUpload errors={{ 'document.pdf': 'Upload failed: Network error' }} />);

      await waitFor(() => {
        expect(screen.getByText('Upload failed: Network error')).toBeInTheDocument();
      });
    });

    it('external error takes precedence over internal validation error', async () => {
      const { container, rerender } = render(<FileUpload maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });

      // Set external error - should override internal error
      rerender(<FileUpload maxSize={100} errors={{ 'large.txt': 'Server rejected file' }} />);

      await waitFor(() => {
        expect(screen.getByText('Server rejected file')).toBeInTheDocument();
        expect(screen.queryByText(/exceeds maximum size/i)).not.toBeInTheDocument();
      });
    });

    it('shows external errors for multiple files', async () => {
      const { container, rerender } = render(<FileUpload multiple />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createMockFile('file1.txt', 100, 'text/plain');
      const file2 = createMockFile('file2.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument();
        expect(screen.getByText('file2.txt')).toBeInTheDocument();
      });

      // Set different errors for each file
      rerender(
        <FileUpload
          multiple
          errors={{
            'file1.txt': 'Permission denied',
            'file2.txt': 'Quota exceeded',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
        expect(screen.getByText('Quota exceeded')).toBeInTheDocument();
      });
    });

    it('clears external error when errors prop is removed', async () => {
      const { container, rerender } = render(
        <FileUpload errors={{ 'test.txt': 'Upload failed' }} />
      );
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('test.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });

      // Remove errors prop
      rerender(<FileUpload />);

      await waitFor(() => {
        expect(screen.queryByText('Upload failed')).not.toBeInTheDocument();
      });
    });
  });

  describe('per-file error display', () => {
    it('shows error for each invalid file when multiple files uploaded', async () => {
      const { container } = render(<FileUpload multiple maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const validFile = createMockFile('small.txt', 50, 'text/plain');
      const invalidFile1 = createMockFile('large1.txt', 200, 'text/plain');
      const invalidFile2 = createMockFile('large2.txt', 300, 'text/plain');

      fireEvent.change(input, { target: { files: [validFile, invalidFile1, invalidFile2] } });

      await waitFor(() => {
        expect(screen.getByText('small.txt')).toBeInTheDocument();
        expect(screen.getByText('large1.txt')).toBeInTheDocument();
        expect(screen.getByText('large2.txt')).toBeInTheDocument();

        // Should show two error messages (one for each invalid file)
        const errorMessages = screen.getAllByText(/exceeds maximum size/i);
        expect(errorMessages).toHaveLength(2);
      });
    });

    it('shows different error types for different files', async () => {
      const { container } = render(<FileUpload multiple maxSize={100} accept=".txt" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const wrongTypeFile = createMockFile('image.png', 50, 'image/png');
      const tooLargeFile = createMockFile('large.txt', 200, 'text/plain');

      fireEvent.change(input, { target: { files: [wrongTypeFile, tooLargeFile] } });

      await waitFor(() => {
        expect(screen.getByText('image.png')).toBeInTheDocument();
        expect(screen.getByText('large.txt')).toBeInTheDocument();
        expect(screen.getByText('File type not accepted')).toBeInTheDocument();
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
    });

    it('applies error styling to files with errors', async () => {
      const { container } = render(<FileUpload maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const fileItem = screen.getByText('large.txt').closest('.flex.flex-col');
        expect(fileItem).toHaveClass('bg-destructive/10');
        expect(fileItem).toHaveClass('border-destructive/20');
      });
    });

    it('removes error when file is removed', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileUpload multiple maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const invalidFile = createMockFile('large.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove large\.txt/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/exceeds maximum size/i)).not.toBeInTheDocument();
      });
    });

    it('preserves errors for remaining files after removing one', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileUpload multiple maxSize={100} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const invalidFile1 = createMockFile('large1.txt', 200, 'text/plain');
      const invalidFile2 = createMockFile('large2.txt', 300, 'text/plain');

      fireEvent.change(input, { target: { files: [invalidFile1, invalidFile2] } });

      await waitFor(() => {
        expect(screen.getAllByText(/exceeds maximum size/i)).toHaveLength(2);
      });

      const removeButton = screen.getByRole('button', { name: /remove large1\.txt/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('large1.txt')).not.toBeInTheDocument();
        expect(screen.getByText('large2.txt')).toBeInTheDocument();
        expect(screen.getAllByText(/exceeds maximum size/i)).toHaveLength(1);
      });
    });
  });
});
