import { Paper, Popper } from '@mui/material';
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
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ApSankeyDiagramProps, SankeyLink, SankeyNode } from './ApSankeyDiagram.types';

const SankeyContainer = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  fontFamily: token.FontFamily.FontNormal,
  width: '100%',
  height: '600px',

  '& svg': {
    display: 'block',
    width: '100%',
    height: '100%',
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
const DIAGRAM_MARGIN_VERTICAL = 5;

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
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
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
          [DIAGRAM_MARGIN_LEFT, DIAGRAM_MARGIN_VERTICAL],
          [actualWidth - DIAGRAM_MARGIN_RIGHT, actualHeight - DIAGRAM_MARGIN_VERTICAL],
        ]);

      // Transform data for d3-sankey
      const graph: SankeyGraph<SankeyNode, SankeyLink> = {
        nodes: data.nodes.map((node) => ({ ...node })),
        links: data.links.map((link) => ({ ...link })),
      };

      // Compute layout
      return sankeyGenerator(graph);
    }, [data, nodeAlignment, nodeWidth, nodePadding, actualWidth, actualHeight]);

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
        typeof document !== 'undefined'
          ? document.createElement('canvas').getContext('2d')
          : null;
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
        const displayLabel = nextCol && ctx
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

    // Handle link hover
    const handleLinkMouseEnter = useCallback(
      (index: number, centerX: number, centerY: number) => {
        // Only update if hovering over a different link
        if (selectedLinkIndex === index) return;

        // Create a virtual anchor element at the link's center
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const virtualAnchor = {
            getBoundingClientRect: () => ({
              x: svgRect.left + centerX,
              y: svgRect.top + centerY,
              left: svgRect.left + centerX,
              top: svgRect.top + centerY,
              right: svgRect.left + centerX,
              bottom: svgRect.top + centerY,
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
        role="img"
        aria-label={ariaLabel}
      >
        <svg ref={svgRef} width={actualWidth} height={actualHeight}>
          {/* Define gradients for links */}
          <defs>
            {linkPaths.map((linkData) => (
              <linearGradient
                key={linkData.gradientId}
                id={linkData.gradientId}
                gradientUnits="userSpaceOnUse"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
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
        </svg>

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
