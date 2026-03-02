import AddIcon from '@mui/icons-material/Add';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import RemoveIcon from '@mui/icons-material/Remove';
import { IconButton, Paper, Popper } from '@mui/material';
import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import {
  type SankeyLink as D3SankeyLink,
  type SankeyNode as D3SankeyNode,
  sankey as d3Sankey,
  type SankeyGraph,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  sankeyRight,
} from 'd3-sankey';
import { schemeTableau10 } from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import { zoom as d3Zoom, type ZoomBehavior, type ZoomTransform, zoomIdentity } from 'd3-zoom';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ApSankeyDiagramProps,
  SankeyData,
  SankeyLink,
  SankeyNode,
} from './ApSankeyDiagram.types';

const SankeyContainer = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  fontFamily: token.FontFamily.FontNormal,
  width: '100%',
  height: '600px',

  '& svg': {
    display: 'block',
  },
});

const StyledSankeyNode = styled('rect')({
  transition: 'opacity 0.2s',
  cursor: 'pointer',

  '&:hover': {
    opacity: 0.8,
  },
});

const StyledSankeyLink = styled('path')({
  transition: 'opacity 0.2s',
  mixBlendMode: 'normal',
  cursor: 'pointer',

  '&:hover': {
    opacity: 1,
  },
});

// Label font — shared between styled components and text measurement
const LABEL_FONT_SIZE = token.FontVariantToken.fontSizeL;
const LABEL_FONT_FAMILY = token.FontFamily.FontNormal;
const LABEL_CSS_FONT = `${token.Typography.fontSizeL.fontWeight} ${token.Typography.fontSizeL.fontSize} ${LABEL_FONT_FAMILY}`;

const StyledSankeyNodeLabel = styled('text')({
  fontSize: LABEL_FONT_SIZE,
  fontFamily: LABEL_FONT_FAMILY,
  fill: 'var(--color-foreground-emp)',
  pointerEvents: 'auto',
  userSelect: 'none',
  cursor: 'default',
});

const StyledSankeyNodeValue = styled('text')({
  fontSize: LABEL_FONT_SIZE,
  fontFamily: LABEL_FONT_FAMILY,
  fontWeight: token.FontFamily.FontWeightMedium,
  fill: 'var(--color-foreground-emp)',
  pointerEvents: 'auto',
  userSelect: 'none',
  cursor: 'default',
});

const LinkTooltipContent = styled(Paper)({
  backgroundColor: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  borderRadius: token.Border.BorderRadiusM,
  padding: token.Spacing.SpacingM,
  minWidth: '200px',
  pointerEvents: 'none',
});

const TooltipRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  padding: `${token.Spacing.SpacingXs} 0`,
  fontSize: token.FontVariantToken.fontSizeS,

  '&:not(:last-child)': {
    borderBottom: '1px solid var(--color-border)',
  },
});

const TooltipHeader = styled('span')({
  fontSize: token.FontVariantToken.fontSizeM,
  fontWeight: token.FontFamily.FontWeightSemibold,
  color: 'var(--color-foreground-emp)',
});

const TooltipLabel = styled('span')({
  color: 'var(--color-foreground-de-emp)',
  marginRight: token.Spacing.SpacingM,
});

const TooltipValue = styled('span')({
  color: 'var(--color-foreground-emp)',
  fontWeight: token.FontFamily.FontWeightSemibold,
});

const ZoomControls = styled('div')({
  position: 'absolute',
  bottom: token.Spacing.SpacingM,
  right: token.Spacing.SpacingM,
  display: 'flex',
  gap: '1px',
  backgroundColor: 'var(--color-border)',
  borderRadius: token.Border.BorderRadiusM,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
});

/**
 * ApSankeyDiagram component for visualizing flow data
 *
 * Example usage:
 * ```tsx
 * <ApSankeyDiagram
 *   data={{
 *     nodes: [
 *       { id: 'a', label: 'Node A' },
 *       { id: 'b', label: 'Node B' },
 *     ],
 *     links: [
 *       { source: 'a', target: 'b', value: 10, metadata: { 'x': 10, 'y': 10 } },
 *     ],
 *   }}
 *   style={{ height: '400px' }}
 * />
 * ```
 */
// Extended node type for D3 Sankey
interface ExtendedSankeyNode extends D3SankeyNode<SankeyNode, SankeyLink>, SankeyNode {
  id: string;
  label: string;
  color?: string;
}

// Extended link type for D3 Sankey
interface ExtendedSankeyLink extends D3SankeyLink<SankeyNode, SankeyLink>, SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

// Layout margins — small left (no labels go left), larger right (for last-column labels)
const DIAGRAM_MARGIN_LEFT = 5;
const DIAGRAM_MARGIN_RIGHT = 120;
const DIAGRAM_MARGIN_TOP = 5;
const DIAGRAM_MARGIN_BOTTOM = 40;
const ZOOM_SCALE_EXTENT_MIN = 0.25;
const ZOOM_SCALE_EXTENT_MAX = 2;

/**
 * Compute minimum SVG dimensions for a Sankey dataset by assigning nodes to
 * columns via forward BFS depth, then counting nodes per column.
 * Returns { minWidth, minHeight }.
 */
export const computeSankeyDimensions = (
  data: SankeyData,
  nodePadding: number,
  minNodeHeight: number,
  minColumnWidth: number,
  marginLeft: number,
  marginRight: number,
  marginTop: number,
  marginBottom: number
): { minWidth: number; minHeight: number } => {
  if (!data || data.nodes.length === 0) return { minWidth: 0, minHeight: 0 };

  // Build adjacency lists
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of data.nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const link of data.links) {
    outgoing.get(link.source)?.push(link.target);
    incoming.get(link.target)?.push(link.source);
  }

  // Forward BFS — compute depth (max distance from sources)
  const depth = new Map<string, number>();
  const sources = data.nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0);
  const queue: string[] = [];
  for (const s of sources) {
    depth.set(s.id, 0);
    queue.push(s.id);
  }
  // Guard against cycles: in the worst-case DAG every edge can enqueue once
  const maxIterations = data.nodes.length * data.links.length + data.nodes.length;
  let iterations = 0;
  while (queue.length > 0 && iterations++ < maxIterations) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const target of outgoing.get(id) ?? []) {
      if (!depth.has(target) || depth.get(target)! < d + 1) {
        depth.set(target, d + 1);
        queue.push(target);
      }
    }
  }

  // Count nodes per column (column = depth)
  const columnCounts = new Map<number, number>();
  for (const d of depth.values()) {
    columnCounts.set(d, (columnCounts.get(d) ?? 0) + 1);
  }

  const columnCount = columnCounts.size;
  const maxNodesPerColumn = Math.max(0, ...columnCounts.values());

  const minWidth = columnCount * minColumnWidth + marginLeft + marginRight;
  const minHeight =
    maxNodesPerColumn * (minNodeHeight + nodePadding) - nodePadding + marginTop + marginBottom;

  return { minWidth, minHeight };
};

// Truncate text to fit within a pixel width, measured via canvas
const truncateToFit = (text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string => {
  if (maxWidth <= 0) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;

  const ellipsis = '\u2026';
  let lo = 0;
  let hi = text.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.substring(0, mid) + ellipsis).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo === 0 ? ellipsis : text.substring(0, lo) + ellipsis;
};

export const ApSankeyDiagram = React.forwardRef<HTMLDivElement, ApSankeyDiagramProps>(
  (props, ref) => {
    const {
      data,
      nodeAlignment = 'justify',
      nodePadding = 16,
      nodeWidth = 24,
      style,
      className,
      colorScheme = schemeTableau10,
      ariaLabel = 'Sankey diagram',
      onLinkClick,
      onNodeClick,
      minNodeHeight = 36,
      minColumnWidth = 140,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomGroupRef = useRef<SVGGElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const zoomTransformRef = useRef<ZoomTransform>(zoomIdentity);
    const hasUserZoomedRef = useRef(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    // Forward the container ref to parent components
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    // Measure container dimensions for responsive sizing
    useEffect(() => {
      if (containerRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            setContainerWidth(entry.contentRect.width);
            setContainerHeight(entry.contentRect.height);
          }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
      return undefined;
    }, []);

    // Calculate actual dimensions (fallback to defaults if not measured yet)
    const actualWidth = containerWidth || 1200;
    const actualHeight = containerHeight || 600;

    // Auto-size: compute minimum dimensions based on data complexity
    const { minWidth, minHeight } = useMemo(() => {
      if (!data || data.nodes.length === 0) return { minWidth: 0, minHeight: 0 };
      return computeSankeyDimensions(
        data,
        nodePadding,
        minNodeHeight,
        minColumnWidth,
        DIAGRAM_MARGIN_LEFT,
        DIAGRAM_MARGIN_RIGHT,
        DIAGRAM_MARGIN_TOP,
        DIAGRAM_MARGIN_BOTTOM
      );
    }, [data, nodePadding, minNodeHeight, minColumnWidth]);

    const svgWidth = Math.max(actualWidth, minWidth);
    const svgHeight = Math.max(actualHeight, minHeight);

    // Create a color map for nodes
    const nodeColorMap = useMemo(() => {
      const map = new Map<string, string>();
      if (!data) return map;

      data.nodes.forEach((node, index) => {
        const color = node.color || colorScheme[index % colorScheme.length];
        map.set(node.id, color || token.Colors.ColorGray500);
      });

      return map;
    }, [data, colorScheme]);

    // Compute Sankey layout
    const sankeyGraph = useMemo(() => {
      if (!data || data.nodes.length === 0) return null;

      // Configure alignment function
      const alignmentFn =
        nodeAlignment === 'left'
          ? sankeyLeft
          : nodeAlignment === 'right'
            ? sankeyRight
            : nodeAlignment === 'center'
              ? sankeyCenter
              : sankeyJustify;

      // Create sankey generator
      const sankeyGenerator = d3Sankey<SankeyNode, SankeyLink>()
        .nodeId((d) => d.id)
        .nodeAlign(alignmentFn)
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([
          [DIAGRAM_MARGIN_LEFT, DIAGRAM_MARGIN_TOP],
          [svgWidth - DIAGRAM_MARGIN_RIGHT, svgHeight - DIAGRAM_MARGIN_BOTTOM],
        ]);

      // Transform data for d3-sankey
      const graph: SankeyGraph<SankeyNode, SankeyLink> = {
        nodes: data.nodes.map((node) => ({ ...node })),
        links: data.links.map((link) => ({ ...link })),
      };

      // Compute layout
      return sankeyGenerator(graph);
    }, [data, nodeAlignment, nodeWidth, nodePadding, svgWidth, svgHeight]);

    // Generate link paths
    const linkPaths = useMemo(() => {
      if (!sankeyGraph) return [];
      const linkPathGenerator = sankeyLinkHorizontal();
      return sankeyGraph.links.map((link, index) => {
        const sourceNode = link.source as ExtendedSankeyNode;
        const targetNode = link.target as ExtendedSankeyNode;

        // Get colors from the color map with fallbacks
        const sourceColor =
          nodeColorMap.get(sourceNode.id) || colorScheme[0] || token.Colors.ColorGray500;
        const targetColor =
          nodeColorMap.get(targetNode.id) || colorScheme[1] || token.Colors.ColorGray500;

        // Calculate center position for tooltip
        const sourceX = sourceNode.x1 || 0;
        const targetX = targetNode.x0 || 0;
        const sourceY = link.y0 || 0;
        const targetY = link.y1 || 0;
        const centerX = (sourceX + targetX) / 2;
        const centerY = (sourceY + targetY) / 2;

        // Preserve original link data with string IDs (d3 mutates source/target to objects)
        const originalLink: SankeyLink = {
          source: sourceNode.id,
          target: targetNode.id,
          value: link.value,
          color: (link as ExtendedSankeyLink).color,
          metadata: (link as ExtendedSankeyLink).metadata,
        };

        return {
          path: linkPathGenerator(link) || '',
          strokeWidth: Math.max(1, link.width || 0),
          color: (link as ExtendedSankeyLink).color,
          sourceColor,
          targetColor,
          gradientId: `sankey-gradient-${index}`,
          originalLink,
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          sourceLabel: sourceNode.label,
          targetLabel: targetNode.label,
          sourceX,
          targetX,
          centerX,
          centerY,
        };
      });
    }, [sankeyGraph, nodeColorMap, colorScheme]);

    // Generate node data for rendering — all labels right-justified
    const nodeData = useMemo(() => {
      if (!sankeyGraph) return [];

      const labelPad = parseInt(token.Spacing.SpacingXs, 10);
      const ctx =
        typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
      if (ctx) ctx.font = LABEL_CSS_FONT;

      // Build sorted column boundaries from the layout
      const columnSet = new Map<number, number>(); // x0 -> x1
      for (const n of sankeyGraph.nodes) {
        const ext = n as ExtendedSankeyNode;
        const x0 = ext.x0 || 0;
        const x1 = ext.x1 || 0;
        if (!columnSet.has(x0)) {
          columnSet.set(x0, x1);
        }
      }
      const columns = Array.from(columnSet.entries())
        .map(([x0, x1]) => ({ x0, x1 }))
        .sort((a, b) => a.x0 - b.x0);

      return sankeyGraph.nodes.map((node, index) => {
        const extNode = node as ExtendedSankeyNode;
        const x0 = extNode.x0 || 0;
        const x1 = extNode.x1 || 0;
        const y0 = extNode.y0 || 0;
        const y1 = extNode.y1 || 0;

        const colIndex = columns.findIndex((col) => col.x0 === x0);
        const nextCol = columns[colIndex + 1];

        // Available space = gap to next column; last column is never truncated
        const displayLabel =
          nextCol && ctx
            ? truncateToFit(extNode.label, Math.max(0, nextCol.x0 - x1 - labelPad), ctx)
            : extNode.label;

        return {
          node: extNode,
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
          color: nodeColorMap.get(extNode.id) || colorScheme[index % colorScheme.length],
          labelX: x1 + labelPad,
          labelY: (y0 + y1) / 2,
          labelAnchor: 'start' as const,
          value: extNode.value || 0,
          displayLabel,
          fullLabel: extNode.label,
        };
      });
    }, [sankeyGraph, nodeColorMap, colorScheme]);

    // Fit-to-view: compute and apply a transform that fits content in the viewport
    const fitToView = useCallback(() => {
      const svg = svgRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!svg || !zoomBehavior || svgWidth === 0 || svgHeight === 0) return;

      hasUserZoomedRef.current = false;

      const cw = containerWidth || 1;
      const ch = containerHeight || 1;
      const scale = Math.min(cw / svgWidth, ch / svgHeight) * 0.95;
      const tx = (cw - svgWidth * scale) / 2;
      const ty = (ch - svgHeight * scale) / 2;
      const t = zoomIdentity.translate(tx, ty).scale(scale);

      select<SVGSVGElement, unknown>(svg)
        .transition()
        .duration(300)
        .call(zoomBehavior.transform, t);
    }, [containerWidth, containerHeight, svgWidth, svgHeight]);

    // Attach d3-zoom behavior
    useEffect(() => {
      const svg = svgRef.current;
      const zoomGroup = zoomGroupRef.current;
      if (!svg || !zoomGroup) return;

      const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
        .scaleExtent([ZOOM_SCALE_EXTENT_MIN, ZOOM_SCALE_EXTENT_MAX])
        .filter((event: Event) => {
          // Require Ctrl/Cmd for wheel zoom so normal scroll isn't hijacked
          if (event.type === 'wheel') {
            return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
          }
          // Allow drag-to-pan and touch gestures; exclude right-click
          return !(event as MouseEvent).button;
        })
        .on('zoom', (event) => {
          const t: ZoomTransform = event.transform;
          zoomTransformRef.current = t;
          zoomGroup.setAttribute('transform', `translate(${t.x},${t.y}) scale(${t.k})`);
          if (event.sourceEvent) {
            // User-initiated events (wheel, drag) have a sourceEvent; programmatic ones don't
            hasUserZoomedRef.current = true;
          }
        });

      zoomBehaviorRef.current = zoomBehavior;
      select<SVGSVGElement, unknown>(svg).call(zoomBehavior);

      return () => {
        select<SVGSVGElement, unknown>(svg).on('.zoom', null);
        zoomBehaviorRef.current = null;
      };
    }, []);

    // Reset user zoom flag when data changes so new data triggers fit-to-view
    useEffect(() => {
      hasUserZoomedRef.current = false;
    }, []);

    // Fit-to-view on mount and data changes; skip on resize if user has manually zoomed
    useEffect(() => {
      if (!sankeyGraph || containerWidth === 0 || containerHeight === 0) return;
      if (hasUserZoomedRef.current) return;
      fitToView();
    }, [sankeyGraph, containerWidth, containerHeight, fitToView]);

    // Zoom control handlers
    const handleZoomIn = useCallback(() => {
      const svg = svgRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!svg || !zoomBehavior) return;
      select<SVGSVGElement, unknown>(svg)
        .transition()
        .duration(200)
        .call(zoomBehavior.scaleBy, 1.3);
    }, []);

    const handleZoomOut = useCallback(() => {
      const svg = svgRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!svg || !zoomBehavior) return;
      select<SVGSVGElement, unknown>(svg)
        .transition()
        .duration(200)
        .call(zoomBehavior.scaleBy, 1 / 1.3);
    }, []);

    // Handle link hover — accounts for zoom transform
    const handleLinkMouseEnter = useCallback(
      (index: number, centerX: number, centerY: number) => {
        // Only update if hovering over a different link
        if (selectedLinkIndex === index) return;

        // Create a virtual anchor element at the link's center, adjusted for zoom
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const t = zoomTransformRef.current;
          const screenX = svgRect.left + centerX * t.k + t.x;
          const screenY = svgRect.top + centerY * t.k + t.y;
          const virtualAnchor = {
            getBoundingClientRect: () => ({
              x: screenX,
              y: screenY,
              left: screenX,
              top: screenY,
              right: screenX,
              bottom: screenY,
              width: 0,
              height: 0,
              toJSON: () => {},
            }),
          } as HTMLElement;
          setAnchorEl(virtualAnchor);
        }
        setSelectedLinkIndex(index);
      },
      [selectedLinkIndex]
    );

    // Handle link mouse leave
    const handleLinkMouseLeave = useCallback(() => {
      setSelectedLinkIndex(null);
      setAnchorEl(null);
    }, []);

    // Handle node hover
    const handleNodeMouseEnter = useCallback((nodeId: string) => {
      setHoveredNodeId(nodeId);
    }, []);

    const handleNodeMouseLeave = useCallback(() => {
      setHoveredNodeId(null);
    }, []);

    const connectedLinkIndices = useMemo(() => {
      if (!hoveredNodeId) return new Set<number>();
      const indices = new Set<number>();
      linkPaths.forEach((linkData, index) => {
        if (linkData.sourceId === hoveredNodeId || linkData.targetId === hoveredNodeId) {
          indices.add(index);
        }
      });
      return indices;
    }, [hoveredNodeId, linkPaths]);

    return (
      <SankeyContainer
        ref={containerRef}
        style={style}
        className={className}
        role="figure"
        aria-label={ariaLabel}
      >
        <svg ref={svgRef} width={actualWidth} height={actualHeight}>
          {/* Zoom group — all content transforms together */}
          <g ref={zoomGroupRef}>
            <defs>
              {linkPaths.map((linkData) => (
                <linearGradient
                  key={linkData.gradientId}
                  id={linkData.gradientId}
                  gradientUnits="userSpaceOnUse"
                  x1={linkData.sourceX}
                  y1={0}
                  x2={linkData.targetX}
                  y2={0}
                >
                  <stop offset="0%" stopColor={linkData.sourceColor} />
                  <stop offset="100%" stopColor={linkData.targetColor} />
                </linearGradient>
              ))}
            </defs>

            {/* Render links */}
            <g>
              {linkPaths.map((linkData, index) => {
                // Check if this link is connected to the hovered node
                const isConnectedToHoveredNode = connectedLinkIndices.has(index);

                // Determine opacity based on hover state
                let opacity = 0.6;
                if (selectedLinkIndex === index) {
                  opacity = 1;
                } else if (hoveredNodeId) {
                  opacity = isConnectedToHoveredNode ? 1 : 0.3;
                }

                return (
                  <StyledSankeyLink
                    key={`link-${index}`}
                    d={linkData.path}
                    stroke={linkData.color ? linkData.color : `url(#${linkData.gradientId})`}
                    strokeWidth={linkData.strokeWidth}
                    fill="none"
                    opacity={opacity}
                    onMouseEnter={() =>
                      handleLinkMouseEnter(index, linkData.centerX, linkData.centerY)
                    }
                    onMouseLeave={handleLinkMouseLeave}
                    onClick={(e) => onLinkClick?.(linkData.originalLink, e)}
                    aria-label={`Link from ${linkData.sourceLabel} to ${linkData.targetLabel}`}
                  />
                );
              })}
            </g>

            {/* Render nodes */}
            <g>
              {nodeData.map((nodeItem) => {
                // Determine node opacity based on hover state
                const nodeOpacity = hoveredNodeId
                  ? hoveredNodeId === nodeItem.node.id
                    ? 1
                    : 0.4
                  : 1;

                return (
                  <g key={`node-${nodeItem.node.id}`}>
                    {/* Node rectangle */}
                    <StyledSankeyNode
                      x={nodeItem.x}
                      y={nodeItem.y}
                      width={nodeItem.width}
                      height={nodeItem.height}
                      fill={nodeItem.color}
                      opacity={nodeOpacity}
                      onMouseEnter={() => handleNodeMouseEnter(nodeItem.node.id)}
                      onMouseLeave={handleNodeMouseLeave}
                      onClick={(e) =>
                        onNodeClick?.(
                          nodeItem.node as SankeyNode,
                          e as React.MouseEvent<SVGRectElement>
                        )
                      }
                    />

                    {/* Node label */}
                    <StyledSankeyNodeLabel
                      x={nodeItem.labelX}
                      y={nodeItem.labelY}
                      dy="0.35em"
                      textAnchor={nodeItem.labelAnchor}
                    >
                      <title>{nodeItem.fullLabel}</title>
                      {nodeItem.displayLabel}
                    </StyledSankeyNodeLabel>

                    {/* Node value */}
                    {nodeItem.value > 0 && (
                      <StyledSankeyNodeValue
                        x={nodeItem.labelX}
                        y={nodeItem.labelY + parseInt(token.Spacing.SpacingM, 10)}
                        dy="0.35em"
                        textAnchor={nodeItem.labelAnchor}
                      >
                        {nodeItem.value}
                      </StyledSankeyNodeValue>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Zoom controls */}
        <ZoomControls>
          <IconButton size="small" onClick={handleZoomIn} aria-label="Zoom in">
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleZoomOut} aria-label="Zoom out">
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={fitToView} aria-label="Fit to view">
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </ZoomControls>

        {/* Render tooltip using Popper for smart positioning */}
        <Popper
          open={selectedLinkIndex !== null && anchorEl !== null}
          anchorEl={anchorEl}
          placement="top"
          style={{ pointerEvents: 'none' }}
          modifiers={[
            {
              name: 'flip',
              enabled: true,
              options: {
                fallbackPlacements: ['bottom', 'top', 'left', 'right'],
              },
            },
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: containerRef.current || 'clippingParents',
                padding: 8,
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 8],
              },
            },
          ]}
        >
          {selectedLinkIndex !== null && linkPaths[selectedLinkIndex] && (
            <LinkTooltipContent elevation={3}>
              {(() => {
                const linkPath = linkPaths[selectedLinkIndex];
                const link = linkPath.originalLink;
                const metadata = link.metadata || {};

                return (
                  <>
                    <TooltipRow>
                      <TooltipHeader>
                        {linkPath.sourceLabel} → {linkPath.targetLabel}
                      </TooltipHeader>
                    </TooltipRow>
                    {Object.entries(metadata).map(([key, value]) => (
                      <TooltipRow key={key}>
                        <TooltipLabel>{key}</TooltipLabel>
                        <TooltipValue>{String(value)}</TooltipValue>
                      </TooltipRow>
                    ))}
                    {Object.keys(metadata).length === 0 && (
                      <TooltipRow>
                        <TooltipLabel>Value</TooltipLabel>
                        <TooltipValue>{link.value}</TooltipValue>
                      </TooltipRow>
                    )}
                  </>
                );
              })()}
            </LinkTooltipContent>
          )}
        </Popper>
      </SankeyContainer>
    );
  }
);

ApSankeyDiagram.displayName = 'ApSankeyDiagram';
