import { useCallback, useState } from 'react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  exportCanvasToImage,
  downloadCanvasAsImage,
  copyCanvasToClipboard,
  type ExportCanvasOptions,
  type ExportCanvasResult,
} from '../utils/export-canvas';

/**
 * State returned by the useExportCanvas hook
 */
export interface UseExportCanvasState {
  /**
   * Whether an export operation is currently in progress
   */
  isExporting: boolean;

  /**
   * Error from the last export operation, if any
   */
  error: Error | null;

  /**
   * Result from the last successful export operation
   */
  lastResult: ExportCanvasResult | null;
}

/**
 * Actions returned by the useExportCanvas hook
 */
export interface UseExportCanvasActions {
  /**
   * Export the canvas to an image data URL
   * @param options - Export configuration options
   * @returns Promise resolving to the export result
   */
  exportToImage: (options?: ExportCanvasOptions) => Promise<ExportCanvasResult | null>;

  /**
   * Download the canvas as an image file
   * @param filename - The filename for the downloaded image
   * @param options - Export configuration options
   */
  downloadAsImage: (filename?: string, options?: ExportCanvasOptions) => Promise<void>;

  /**
   * Copy the canvas image to the clipboard
   * @param options - Export configuration options (format will be forced to PNG)
   */
  copyToClipboard: (options?: Omit<ExportCanvasOptions, 'format'>) => Promise<void>;

  /**
   * Clear the last error state
   */
  clearError: () => void;
}

/**
 * Return type of the useExportCanvas hook
 */
export type UseExportCanvasReturn = UseExportCanvasState & UseExportCanvasActions;

/**
 * Hook for exporting the canvas to various image formats.
 *
 * This hook provides a convenient interface for exporting, downloading, and copying
 * the canvas content as images. It must be used within a ReactFlowProvider context.
 *
 * @returns Object containing export state and action methods
 *
 * @example
 * ```tsx
 * function ExportPanel() {
 *   const { isExporting, error, downloadAsImage, copyToClipboard } = useExportCanvas();
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => downloadAsImage("my-workflow")}
 *         disabled={isExporting}
 *       >
 *         {isExporting ? "Exporting..." : "Download PNG"}
 *       </button>
 *
 *       <button
 *         onClick={() => copyToClipboard()}
 *         disabled={isExporting}
 *       >
 *         Copy to Clipboard
 *       </button>
 *
 *       {error && <p className="error">{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom options
 * function ExportWithOptions() {
 *   const { downloadAsImage, exportToImage } = useExportCanvas();
 *
 *   const handleExportPNG = () => {
 *     downloadAsImage("workflow", {
 *       width: 1920,
 *       height: 1080,
 *       backgroundColor: "#ffffff",
 *       format: "png"
 *     });
 *   };
 *
 *   const handleExportJPEG = () => {
 *     downloadAsImage("workflow", {
 *       format: "jpeg",
 *       quality: 0.9,
 *       backgroundColor: "#f5f5f5"
 *     });
 *   };
 *
 *   const handleGetDataUrl = async () => {
 *     const result = await exportToImage({ format: "png" });
 *     if (result) {
 *       // Use result.dataUrl for custom handling
 *       console.log("Exported:", result.dataUrl);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleExportPNG}>Export PNG</button>
 *       <button onClick={handleExportJPEG}>Export JPEG</button>
 *       <button onClick={handleGetDataUrl}>Get Data URL</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useExportCanvas(): UseExportCanvasReturn {
  const reactFlowInstance = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<ExportCanvasResult | null>(null);

  const exportToImage = useCallback(
    async (options?: ExportCanvasOptions): Promise<ExportCanvasResult | null> => {
      setIsExporting(true);
      setError(null);

      // Yield to event loop so React can render the loading state
      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        const result = await exportCanvasToImage(reactFlowInstance, options);
        setLastResult(result);
        return result;
      } catch (err) {
        const exportError = err instanceof Error ? err : new Error('Failed to export canvas');
        setError(exportError);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [reactFlowInstance]
  );

  const downloadAsImage = useCallback(
    async (filename?: string, options?: ExportCanvasOptions): Promise<void> => {
      setIsExporting(true);
      setError(null);

      // Yield to event loop so React can render the loading state
      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        await downloadCanvasAsImage(reactFlowInstance, filename, options);
      } catch (err) {
        const downloadError = err instanceof Error ? err : new Error('Failed to download canvas');
        setError(downloadError);
      } finally {
        setIsExporting(false);
      }
    },
    [reactFlowInstance]
  );

  const copyToClipboard = useCallback(
    async (options?: Omit<ExportCanvasOptions, 'format'>): Promise<void> => {
      setIsExporting(true);
      setError(null);

      // Yield to event loop so React can render the loading state
      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        await copyCanvasToClipboard(reactFlowInstance, options);
      } catch (err) {
        const copyError =
          err instanceof Error ? err : new Error('Failed to copy canvas to clipboard');
        setError(copyError);
      } finally {
        setIsExporting(false);
      }
    },
    [reactFlowInstance]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isExporting,
    error,
    lastResult,
    exportToImage,
    downloadAsImage,
    copyToClipboard,
    clearError,
  };
}
