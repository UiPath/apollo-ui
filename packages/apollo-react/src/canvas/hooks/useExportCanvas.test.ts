import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExportCanvasResult } from '../utils/export-canvas';

// Mock useReactFlow
const mockReactFlowInstance = {
  getNodes: vi.fn(),
  getViewport: vi.fn(),
  setViewport: vi.fn(),
  fitView: vi.fn(),
};

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/apollo-react/canvas/xyflow/react')),
  useReactFlow: () => mockReactFlowInstance,
}));

// Mock export utilities
vi.mock('../utils/export-canvas', () => ({
  exportCanvasToImage: vi.fn(),
  downloadCanvasAsImage: vi.fn(),
  copyCanvasToClipboard: vi.fn(),
}));

import { useExportCanvas } from './useExportCanvas';
import * as exportUtils from '../utils/export-canvas';

const mockExportCanvasToImage = vi.mocked(exportUtils.exportCanvasToImage);
const mockDownloadCanvasAsImage = vi.mocked(exportUtils.downloadCanvasAsImage);
const mockCopyCanvasToClipboard = vi.mocked(exportUtils.copyCanvasToClipboard);

describe('useExportCanvas', () => {
  const mockExportResult = {
    dataUrl: 'data:image/png;base64,mockData',
    width: 1920,
    height: 1080,
    format: 'png' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportCanvasToImage.mockResolvedValue(mockExportResult);
    mockDownloadCanvasAsImage.mockResolvedValue(undefined);
    mockCopyCanvasToClipboard.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('returns initial state with isExporting false', () => {
      const { result } = renderHook(() => useExportCanvas());

      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastResult).toBeNull();
    });

    it('returns action methods', () => {
      const { result } = renderHook(() => useExportCanvas());

      expect(typeof result.current.exportToImage).toBe('function');
      expect(typeof result.current.downloadAsImage).toBe('function');
      expect(typeof result.current.copyToClipboard).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('exportToImage', () => {
    it('sets isExporting to true during export', async () => {
      let resolveExport: (value: typeof mockExportResult) => void;
      mockExportCanvasToImage.mockReturnValue(
        new Promise((resolve) => {
          resolveExport = resolve;
        })
      );

      const { result } = renderHook(() => useExportCanvas());

      act(() => {
        result.current.exportToImage();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
      });

      await act(async () => {
        resolveExport!(mockExportResult);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });

    it('returns export result on success', async () => {
      const { result } = renderHook(() => useExportCanvas());

      let exportResult: ExportCanvasResult | null = null;
      await act(async () => {
        exportResult = await result.current.exportToImage();
      });

      expect(exportResult).toEqual(mockExportResult);
      expect(result.current.lastResult).toEqual(mockExportResult);
      expect(result.current.error).toBeNull();
    });

    it('passes options to exportCanvasToImage', async () => {
      const { result } = renderHook(() => useExportCanvas());
      const options = { format: 'jpeg' as const, quality: 0.8 };

      await act(async () => {
        await result.current.exportToImage(options);
      });

      expect(mockExportCanvasToImage).toHaveBeenCalledWith(mockReactFlowInstance, options);
    });

    it('sets error state on failure', async () => {
      const error = new Error('Export failed');
      mockExportCanvasToImage.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useExportCanvas());

      let exportResult: ExportCanvasResult | null = null;
      await act(async () => {
        exportResult = await result.current.exportToImage();
      });

      expect(exportResult).toBeNull();
      expect(result.current.error).toEqual(error);
      expect(result.current.isExporting).toBe(false);
    });

    it('handles non-Error exceptions', async () => {
      mockExportCanvasToImage.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useExportCanvas());

      await act(async () => {
        await result.current.exportToImage();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to export canvas');
    });
  });

  describe('downloadAsImage', () => {
    it('calls downloadCanvasAsImage with correct parameters', async () => {
      const { result } = renderHook(() => useExportCanvas());

      await act(async () => {
        await result.current.downloadAsImage('my-canvas', { format: 'png' });
      });

      expect(mockDownloadCanvasAsImage).toHaveBeenCalledWith(mockReactFlowInstance, 'my-canvas', {
        format: 'png',
      });
    });

    it('sets isExporting during download', async () => {
      let resolveDownload: () => void;
      mockDownloadCanvasAsImage.mockReturnValue(
        new Promise((resolve) => {
          resolveDownload = resolve;
        })
      );

      const { result } = renderHook(() => useExportCanvas());

      act(() => {
        result.current.downloadAsImage('test');
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
      });

      await act(async () => {
        resolveDownload!();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });

    it('sets error state on failure', async () => {
      const error = new Error('Download failed');
      mockDownloadCanvasAsImage.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useExportCanvas());

      await act(async () => {
        await result.current.downloadAsImage('test');
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('copyToClipboard', () => {
    it('calls copyCanvasToClipboard with correct parameters', async () => {
      const { result } = renderHook(() => useExportCanvas());
      const options = { backgroundColor: '#ffffff' };

      await act(async () => {
        await result.current.copyToClipboard(options);
      });

      expect(mockCopyCanvasToClipboard).toHaveBeenCalledWith(mockReactFlowInstance, options);
    });

    it('sets isExporting during copy', async () => {
      let resolveCopy: () => void;
      mockCopyCanvasToClipboard.mockReturnValue(
        new Promise((resolve) => {
          resolveCopy = resolve;
        })
      );

      const { result } = renderHook(() => useExportCanvas());

      act(() => {
        result.current.copyToClipboard();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
      });

      await act(async () => {
        resolveCopy!();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });

    it('sets error state on failure', async () => {
      const error = new Error('Copy failed');
      mockCopyCanvasToClipboard.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useExportCanvas());

      await act(async () => {
        await result.current.copyToClipboard();
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      mockExportCanvasToImage.mockRejectedValueOnce(new Error('Export failed'));

      const { result } = renderHook(() => useExportCanvas());

      await act(async () => {
        await result.current.exportToImage();
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('memoization', () => {
    it('memoizes action callbacks', () => {
      const { result, rerender } = renderHook(() => useExportCanvas());

      const firstExportToImage = result.current.exportToImage;
      const firstDownloadAsImage = result.current.downloadAsImage;
      const firstCopyToClipboard = result.current.copyToClipboard;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.exportToImage).toBe(firstExportToImage);
      expect(result.current.downloadAsImage).toBe(firstDownloadAsImage);
      expect(result.current.copyToClipboard).toBe(firstCopyToClipboard);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });
});
