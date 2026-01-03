import type { ReactFlowInstance, Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toJpeg: vi.fn(),
  toSvg: vi.fn(),
}));

import { toJpeg, toPng, toSvg } from 'html-to-image';
import {
  copyCanvasToClipboard,
  downloadCanvasAsImage,
  exportCanvasToImage,
  getFileExtension,
  getMimeType,
} from './export-canvas';

const mockToPng = vi.mocked(toPng);
const mockToJpeg = vi.mocked(toJpeg);
const mockToSvg = vi.mocked(toSvg);

describe('export-canvas utilities', () => {
  const mockViewport: Viewport = { x: 0, y: 0, zoom: 1 };
  const mockNodes = [
    { id: 'node-1', position: { x: 0, y: 0 }, data: {} },
    { id: 'node-2', position: { x: 100, y: 100 }, data: {} },
  ];

  const mockReactFlowInstance = {
    getNodes: vi.fn(() => mockNodes),
    getViewport: vi.fn(() => mockViewport),
    setViewport: vi.fn(),
    fitView: vi.fn(() => Promise.resolve()),
  } as unknown as ReactFlowInstance;

  const mockViewportElement = document.createElement('div');
  mockViewportElement.className = 'react-flow__viewport';

  const mockReactFlowWrapper = document.createElement('div');
  mockReactFlowWrapper.className = 'react-flow';
  Object.defineProperty(mockReactFlowWrapper, 'clientWidth', { value: 800 });
  Object.defineProperty(mockReactFlowWrapper, 'clientHeight', { value: 600 });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Setup DOM mocks
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '.react-flow') return mockReactFlowWrapper;
      if (selector === '.react-flow__viewport') return mockViewportElement;
      return null;
    });

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '#f5f5f5',
    } as unknown as CSSStyleDeclaration);

    // Mock successful export
    mockToPng.mockResolvedValue('data:image/png;base64,mockPngData');
    mockToJpeg.mockResolvedValue('data:image/jpeg;base64,mockJpegData');
    mockToSvg.mockResolvedValue('data:image/svg+xml;base64,mockSvgData');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getFileExtension', () => {
    it("returns 'png' for png format", () => {
      expect(getFileExtension('png')).toBe('png');
    });

    it("returns 'jpg' for jpeg format", () => {
      expect(getFileExtension('jpeg')).toBe('jpg');
    });

    it("returns 'svg' for svg format", () => {
      expect(getFileExtension('svg')).toBe('svg');
    });
  });

  describe('getMimeType', () => {
    it("returns 'image/png' for png format", () => {
      expect(getMimeType('png')).toBe('image/png');
    });

    it("returns 'image/jpeg' for jpeg format", () => {
      expect(getMimeType('jpeg')).toBe('image/jpeg');
    });

    it("returns 'image/svg+xml' for svg format", () => {
      expect(getMimeType('svg')).toBe('image/svg+xml');
    });
  });

  describe('exportCanvasToImage', () => {
    it('throws error when no nodes are found', async () => {
      const emptyInstance = {
        ...mockReactFlowInstance,
        getNodes: vi.fn(() => []),
      } as unknown as ReactFlowInstance;

      await expect(exportCanvasToImage(emptyInstance)).rejects.toThrow(
        'Cannot export canvas: no nodes found'
      );
    });

    it('throws error when React Flow wrapper is not found', async () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      await expect(exportCanvasToImage(mockReactFlowInstance)).rejects.toThrow(
        'Cannot find React Flow wrapper element'
      );
    });

    it('throws error when viewport element is not found', async () => {
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === '.react-flow') return mockReactFlowWrapper;
        return null;
      });

      await expect(exportCanvasToImage(mockReactFlowInstance)).rejects.toThrow(
        'Cannot find viewport element with selector'
      );
    });

    it('exports to PNG by default', async () => {
      const result = await exportCanvasToImage(mockReactFlowInstance);

      expect(mockToPng).toHaveBeenCalled();
      expect(result.format).toBe('png');
      expect(result.dataUrl).toBe('data:image/png;base64,mockPngData');
    });

    it('exports to JPEG when specified', async () => {
      const result = await exportCanvasToImage(mockReactFlowInstance, { format: 'jpeg' });

      expect(mockToJpeg).toHaveBeenCalled();
      expect(result.format).toBe('jpeg');
    });

    it('exports to SVG when specified', async () => {
      const result = await exportCanvasToImage(mockReactFlowInstance, { format: 'svg' });

      expect(mockToSvg).toHaveBeenCalled();
      expect(result.format).toBe('svg');
    });

    it('sets viewport to show all nodes for export', async () => {
      await exportCanvasToImage(mockReactFlowInstance);

      // setViewport is called twice: once for export positioning, once for restore
      expect(mockReactFlowInstance.setViewport).toHaveBeenCalledTimes(2);
      // First call sets the export viewport with calculated position and zoom
      expect(mockReactFlowInstance.setViewport).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          zoom: expect.any(Number),
        }),
        { duration: 0 }
      );
    });

    it('restores original viewport after export', async () => {
      await exportCanvasToImage(mockReactFlowInstance);

      // Second setViewport call restores the original viewport
      expect(mockReactFlowInstance.setViewport).toHaveBeenNthCalledWith(2, mockViewport);
    });

    it('restores viewport even when export fails', async () => {
      mockToPng.mockRejectedValueOnce(new Error('Export failed'));

      await expect(exportCanvasToImage(mockReactFlowInstance)).rejects.toThrow('Export failed');
      // Should still restore the original viewport
      expect(mockReactFlowInstance.setViewport).toHaveBeenLastCalledWith(mockViewport);
    });

    it('returns correct dimensions based on container size with pixelRatio', async () => {
      const result = await exportCanvasToImage(mockReactFlowInstance, { format: 'png' });

      // Dimensions are based on container size (800x600) scaled by pixelRatio (3)
      // Container width: 800, height: 600
      // With pixelRatio 3: 800*3=2400, 600*3=1800
      expect(result.width).toBe(2400);
      expect(result.height).toBe(1800);
    });

    it('returns container dimensions for SVG format (no pixelRatio)', async () => {
      const result = await exportCanvasToImage(mockReactFlowInstance, { format: 'svg' });

      // SVG doesn't use pixelRatio, dimensions are from container size
      // Container width: 800, height: 600
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('does not include pixelRatio in export options for SVG', async () => {
      await exportCanvasToImage(mockReactFlowInstance, { format: 'svg' });

      const callArgs = mockToSvg.mock.calls[0]?.[1];
      expect(callArgs).toBeDefined();
      expect(callArgs).not.toHaveProperty('pixelRatio');
    });

    it('includes pixelRatio in export options for PNG', async () => {
      await exportCanvasToImage(mockReactFlowInstance, { format: 'png', pixelRatio: 3 });

      const callArgs = mockToPng.mock.calls[0]?.[1];
      expect(callArgs).toBeDefined();
      expect(callArgs).toHaveProperty('pixelRatio', 3);
    });

    it('includes quality option only for JPEG format', async () => {
      await exportCanvasToImage(mockReactFlowInstance, { format: 'jpeg', quality: 0.8 });

      const callArgs = mockToJpeg.mock.calls[0]?.[1];
      expect(callArgs).toBeDefined();
      expect(callArgs).toHaveProperty('quality', 0.8);
    });

    it('uses background color from CSS variable', async () => {
      await exportCanvasToImage(mockReactFlowInstance);

      const callArgs = mockToPng.mock.calls[0]?.[1];
      expect(callArgs).toBeDefined();
      expect(callArgs).toHaveProperty('backgroundColor', '#f5f5f5');
    });

    it('uses custom background color when provided', async () => {
      await exportCanvasToImage(mockReactFlowInstance, { backgroundColor: '#000000' });

      const callArgs = mockToPng.mock.calls[0]?.[1];
      expect(callArgs).toBeDefined();
      expect(callArgs).toHaveProperty('backgroundColor', '#000000');
    });

    it('calculates viewport to fit all nodes in container', async () => {
      await exportCanvasToImage(mockReactFlowInstance);

      // First setViewport call should position nodes to fit in container
      const calls = (mockReactFlowInstance.setViewport as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const firstCallArgs = calls[0]?.[0];
      expect(firstCallArgs).toBeDefined();
      expect(firstCallArgs).toHaveProperty('x');
      expect(firstCallArgs).toHaveProperty('y');
      expect(firstCallArgs).toHaveProperty('zoom');
      // Zoom should be calculated to fit all nodes in the container
      expect(firstCallArgs.zoom).toBeLessThanOrEqual(2); // respects maxZoom
    });
  });

  describe('downloadCanvasAsImage', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = document.createElement('a');
      mockLink.click = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    });

    it('creates download link with correct filename', async () => {
      await downloadCanvasAsImage(mockReactFlowInstance, 'my-canvas');

      expect(mockLink.download).toBe('my-canvas.png');
      expect(mockLink.href).toBe('data:image/png;base64,mockPngData');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('uses correct extension for JPEG format', async () => {
      await downloadCanvasAsImage(mockReactFlowInstance, 'my-canvas', { format: 'jpeg' });

      expect(mockLink.download).toBe('my-canvas.jpg');
    });

    it('uses default filename when not provided', async () => {
      await downloadCanvasAsImage(mockReactFlowInstance);

      expect(mockLink.download).toBe('canvas-export.png');
    });

    it('does not duplicate extension if already present', async () => {
      await downloadCanvasAsImage(mockReactFlowInstance, 'my-canvas.png');

      expect(mockLink.download).toBe('my-canvas.png');
    });
  });

  describe('copyCanvasToClipboard', () => {
    const mockClipboardWrite = vi.fn();
    const mockBlob = new Blob(['test'], { type: 'image/png' });

    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: mockClipboardWrite },
        writable: true,
        configurable: true,
      });

      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      global.ClipboardItem = vi
        .fn()
        .mockImplementation((items) => items) as unknown as typeof ClipboardItem;
    });

    it('throws error when Clipboard API is not available', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(copyCanvasToClipboard(mockReactFlowInstance)).rejects.toThrow(
        'Clipboard API is not supported in this browser'
      );
    });

    it('throws error when clipboard.write is not available', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {},
        writable: true,
        configurable: true,
      });

      await expect(copyCanvasToClipboard(mockReactFlowInstance)).rejects.toThrow(
        'Clipboard API is not supported in this browser'
      );
    });

    it('forces PNG format for clipboard', async () => {
      await copyCanvasToClipboard(mockReactFlowInstance);

      expect(mockToPng).toHaveBeenCalled();
      expect(mockToJpeg).not.toHaveBeenCalled();
      expect(mockToSvg).not.toHaveBeenCalled();
    });

    it('converts data URL to blob and writes to clipboard', async () => {
      await copyCanvasToClipboard(mockReactFlowInstance);

      expect(global.fetch).toHaveBeenCalledWith('data:image/png;base64,mockPngData');
      expect(mockClipboardWrite).toHaveBeenCalled();
    });
  });
});
