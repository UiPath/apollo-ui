import { toPng, toJpeg, toSvg } from "html-to-image";
import type { Node, ReactFlowInstance, Viewport } from "@uipath/uix/xyflow/react";

/**
 * Supported image formats for canvas export
 */
export type ExportImageFormat = "png" | "jpeg" | "svg";

/**
 * Options for exporting the canvas to an image
 */
export interface ExportCanvasOptions {
  /**
   * Width of the exported image in pixels.
   * If not specified and `fitToContent` is true, width is calculated from node bounds.
   * @default 1920
   */
  width?: number;

  /**
   * Height of the exported image in pixels.
   * If not specified and `fitToContent` is true, height is calculated from node bounds.
   * @default 1080
   */
  height?: number;

  /**
   * When true, automatically calculates image dimensions to fit all nodes.
   * This overrides width/height options and ensures all nodes are captured.
   * @default true
   */
  fitToContent?: boolean;

  /**
   * Background color of the exported image
   * @default "#ffffff"
   */
  backgroundColor?: string;

  /**
   * Image format to export
   * @default "png"
   */
  format?: ExportImageFormat;

  /**
   * Quality of the exported image (0-1), only applicable for jpeg format
   * @default 0.95
   */
  quality?: number;

  /**
   * Minimum zoom level when calculating viewport bounds
   * @default 0.01
   */
  minZoom?: number;

  /**
   * Maximum zoom level when calculating viewport bounds
   * @default 2
   */
  maxZoom?: number;

  /**
   * Padding around the nodes in the exported image (as a ratio of the viewport)
   * @default 0.05
   */
  padding?: number;

  /**
   * Custom CSS selector for the viewport element.
   * Defaults to ".react-flow__viewport"
   */
  viewportSelector?: string;

  /**
   * Filter function to exclude certain DOM nodes from the export
   */
  filter?: (node: HTMLElement) => boolean;

  /**
   * Whether to include images in the export (may require CORS handling)
   * @default true
   */
  includeImages?: boolean;

  /**
   * Pixel ratio for high-DPI exports. Higher values produce sharper images
   * but increase file size and export time.
   * @default 3
   */
  pixelRatio?: number;

  /**
   * Whether to skip font embedding for faster exports. When false, fonts are
   * embedded in the image for better text rendering quality.
   * @default false
   */
  skipFonts?: boolean;
}

/**
 * Result of the canvas export operation
 */
export interface ExportCanvasResult {
  /**
   * The data URL of the exported image
   */
  dataUrl: string;

  /**
   * Width of the exported image
   */
  width: number;

  /**
   * Height of the exported image
   */
  height: number;

  /**
   * The format of the exported image
   */
  format: ExportImageFormat;
}

/**
 * Gets the canvas background color from CSS variable
 */
function getCanvasBackgroundColor(): string {
  const reactFlowElement = document.querySelector(".react-flow");
  if (reactFlowElement) {
    const color = getComputedStyle(reactFlowElement).getPropertyValue("--uix-canvas-background").trim();
    if (color) return color;
  }
  return "#ffffff";
}

/**
 * Delay in milliseconds to wait for nodes to fully render after fitView.
 * This ensures all nodes are painted before capturing the image.
 */
const RENDER_STABILIZATION_DELAY_MS = 300;

const DEFAULT_OPTIONS: Omit<Required<Omit<ExportCanvasOptions, "filter">>, "backgroundColor"> & { backgroundColor?: string } = {
  width: 1920,
  height: 1080,
  fitToContent: true,
  backgroundColor: undefined, // Resolved at runtime from CSS variable
  format: "png",
  quality: 0.95,
  minZoom: 0.01, // Very low to allow fitting large canvases
  maxZoom: 2,
  padding: 0.05,
  viewportSelector: ".react-flow__viewport",
  includeImages: true,
  pixelRatio: 3, // Higher resolution output for better quality
  skipFonts: false, // Include fonts for better text rendering
};

/**
 * Gets the appropriate export function based on the format
 */
function getExportFunction(format: ExportImageFormat) {
  switch (format) {
    case "jpeg":
      return toJpeg;
    case "svg":
      return toSvg;
    case "png":
    default:
      return toPng;
  }
}

/**
 * Gets the file extension for a given format
 */
export function getFileExtension(format: ExportImageFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

/**
 * Gets the MIME type for a given format
 */
export function getMimeType(format: ExportImageFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml";
    case "png":
    default:
      return "image/png";
  }
}

/**
 * Helper to wait for a specified time and yield to the event loop
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yields to the event loop to allow UI updates (like spinner animation)
 */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    // Use setTimeout to yield to the event loop
    setTimeout(resolve, 0);
  });
}

/**
 * Default node dimensions when measured dimensions are not available
 */
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

/**
 * Calculates the bounding box of all nodes in flow coordinates
 */
function getNodesBounds(nodes: Node[]): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const nodeWidth = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const nodeHeight = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Exports the canvas to an image data URL.
 *
 * This function captures the current state of the React Flow canvas and converts it
 * to an image. It automatically adjusts the viewport to include all nodes, captures
 * the image, then restores the original viewport.
 *
 * Note: This temporarily changes the viewport to render all nodes (required when
 * virtualization is enabled). The original viewport is restored after capture.
 *
 * @param reactFlowInstance - The React Flow instance to export from
 * @param options - Export configuration options
 * @returns Promise resolving to the export result with dataUrl and metadata
 *
 * @example
 * ```tsx
 * // Using with BaseCanvas ref
 * const canvasRef = useRef<BaseCanvasRef>(null);
 *
 * const handleExport = async () => {
 *   const reactFlow = canvasRef.current?.reactFlow;
 *   if (!reactFlow) return;
 *
 *   const result = await exportCanvasToImage(reactFlow, {
 *     width: 1920,
 *     height: 1080,
 *     backgroundColor: "#f5f5f5",
 *     format: "png"
 *   });
 *
 *   console.log(result.dataUrl);
 * };
 * ```
 */
export async function exportCanvasToImage<NodeType extends Node = Node>(
  reactFlowInstance: ReactFlowInstance<NodeType>,
  options: ExportCanvasOptions = {}
): Promise<ExportCanvasResult> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    backgroundColor: options.backgroundColor ?? getCanvasBackgroundColor(),
  };

  const nodes = reactFlowInstance.getNodes();

  if (nodes.length === 0) {
    throw new Error("Cannot export canvas: no nodes found");
  }

  // Find the React Flow wrapper to get its dimensions
  const reactFlowWrapper = document.querySelector<HTMLElement>(".react-flow");
  if (!reactFlowWrapper) {
    throw new Error("Cannot find React Flow wrapper element");
  }

  const viewportElement = document.querySelector<HTMLElement>(opts.viewportSelector);
  if (!viewportElement) {
    throw new Error(`Cannot find viewport element with selector: ${opts.viewportSelector}`);
  }

  // Save current viewport to restore later
  const originalViewport: Viewport = reactFlowInstance.getViewport();

  // Yield to allow spinner to render
  await yieldToMain();

  // Calculate the bounding box of all nodes
  const bounds = getNodesBounds(nodes);
  const paddingAmount = Math.max(bounds.width, bounds.height) * opts.padding;

  // Get the current container dimensions
  const containerWidth = reactFlowWrapper.clientWidth || opts.width;
  const containerHeight = reactFlowWrapper.clientHeight || opts.height;

  // Calculate the zoom level needed to fit all nodes into the CURRENT container
  // This ensures all nodes are "visible" and will be rendered (bypassing virtualization)
  const contentWidth = bounds.width + paddingAmount * 2;
  const contentHeight = bounds.height + paddingAmount * 2;
  const fitZoomX = containerWidth / contentWidth;
  const fitZoomY = containerHeight / contentHeight;
  const fitZoom = Math.min(fitZoomX, fitZoomY, opts.maxZoom);

  // Calculate the viewport position to center the nodes in the container
  const centeredX = (containerWidth - contentWidth * fitZoom) / 2 - bounds.x * fitZoom + paddingAmount * fitZoom;
  const centeredY = (containerHeight - contentHeight * fitZoom) / 2 - bounds.y * fitZoom + paddingAmount * fitZoom;

  // Set viewport to show all nodes - they will all be rendered since they fit in the container
  reactFlowInstance.setViewport({ x: centeredX, y: centeredY, zoom: fitZoom }, { duration: 0 });

  // Yield again
  await yieldToMain();

  // Wait for React Flow to render the nodes
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

  // Additional wait to ensure all nodes are fully rendered
  await wait(RENDER_STABILIZATION_DELAY_MS);

  // Yield before heavy export work
  await yieldToMain();

  const exportFn = getExportFunction(opts.format);

  // Filter function to skip unnecessary elements for faster export
  const defaultFilter = (node: HTMLElement): boolean => {
    // Skip React Flow UI elements that aren't part of the flow content
    const className = node.className;
    if (typeof className === "string") {
      if (
        className.includes("react-flow__minimap") ||
        className.includes("react-flow__controls") ||
        className.includes("react-flow__attribution") ||
        className.includes("react-flow__panel") ||
        className.includes("react-flow__background")
      ) {
        return false;
      }
    }
    return true;
  };

  // Combine with user filter if provided
  const combinedFilter = (node: HTMLElement): boolean => {
    if (!defaultFilter(node)) return false;
    if (!opts.includeImages) {
      const tagName = node.tagName?.toLowerCase();
      if (tagName === "img" || tagName === "image") return false;
    }
    if (opts.filter && !opts.filter(node)) return false;
    return true;
  };

  // Capture the viewport element at the container's current dimensions
  // The pixelRatio will scale up the output for better quality
  const isSvgFormat = opts.format === "svg";
  const exportOptions: Parameters<typeof toPng>[1] = {
    backgroundColor: opts.backgroundColor,
    width: containerWidth,
    height: containerHeight,
    cacheBust: false, // Faster - don't add cache-busting query params
    skipFonts: opts.skipFonts,
    filter: combinedFilter,
    // pixelRatio only applies to raster formats (PNG, JPEG), not SVG
    ...(!isSvgFormat && { pixelRatio: opts.pixelRatio }),
    ...(opts.format === "jpeg" && { quality: opts.quality }),
  };

  let dataUrl: string;
  try {
    // Capture only the viewport element (nodes and edges, no panels/toolbars)
    dataUrl = await exportFn(viewportElement, exportOptions);
  } finally {
    // Always restore the original viewport, even if export fails
    reactFlowInstance.setViewport(originalViewport);
  }

  // For SVG, return actual dimensions since pixelRatio doesn't apply to vector formats
  const resultWidth = isSvgFormat ? containerWidth : containerWidth * opts.pixelRatio;
  const resultHeight = isSvgFormat ? containerHeight : containerHeight * opts.pixelRatio;

  return {
    dataUrl,
    width: resultWidth,
    height: resultHeight,
    format: opts.format,
  };
}

/**
 * Downloads the canvas as an image file.
 *
 * This is a convenience wrapper around `exportCanvasToImage` that automatically
 * triggers a file download in the browser.
 *
 * @param reactFlowInstance - The React Flow instance to export from
 * @param filename - The filename for the downloaded image (without extension)
 * @param options - Export configuration options
 *
 * @example
 * ```tsx
 * // Simple download
 * await downloadCanvasAsImage(reactFlow, "my-workflow");
 *
 * // With options
 * await downloadCanvasAsImage(reactFlow, "my-workflow", {
 *   format: "jpeg",
 *   quality: 0.8,
 *   backgroundColor: "#1a1a1a"
 * });
 * ```
 */
export async function downloadCanvasAsImage<NodeType extends Node = Node>(
  reactFlowInstance: ReactFlowInstance<NodeType>,
  filename: string = "canvas-export",
  options: ExportCanvasOptions = {}
): Promise<void> {
  const result = await exportCanvasToImage(reactFlowInstance, options);

  const extension = getFileExtension(result.format);
  const fullFilename = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;

  const link = document.createElement("a");
  link.download = fullFilename;
  link.href = result.dataUrl;
  link.click();
}

/**
 * Copies the canvas image to the clipboard.
 *
 * Note: This only works with PNG format due to clipboard API limitations.
 * The browser must support the Clipboard API.
 *
 * @param reactFlowInstance - The React Flow instance to export from
 * @param options - Export configuration options (format will be forced to PNG)
 * @returns Promise that resolves when the image is copied to clipboard
 *
 * @example
 * ```tsx
 * try {
 *   await copyCanvasToClipboard(reactFlow, {
 *     width: 800,
 *     height: 600
 *   });
 *   toast.success("Copied to clipboard!");
 * } catch (error) {
 *   toast.error("Failed to copy to clipboard");
 * }
 * ```
 */
export async function copyCanvasToClipboard<NodeType extends Node = Node>(
  reactFlowInstance: ReactFlowInstance<NodeType>,
  options: Omit<ExportCanvasOptions, "format"> = {}
): Promise<void> {
  // Check if Clipboard API is available
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard API is not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.");
  }

  // Clipboard API only supports PNG
  const result = await exportCanvasToImage(reactFlowInstance, { ...options, format: "png" });

  // Convert data URL to blob
  const response = await fetch(result.dataUrl);
  const blob = await response.blob();

  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
}
