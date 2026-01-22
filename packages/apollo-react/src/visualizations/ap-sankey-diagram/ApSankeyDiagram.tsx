import { styled } from '@mui/material/styles';
import { Popper, Paper } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import token from '@uipath/apollo-core';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  sankeyJustify,
  sankeyLeft,
  sankeyRight,
  sankeyCenter,
  type SankeyGraph,
  type SankeyNode as D3SankeyNode,
  type SankeyLink as D3SankeyLink,
} from 'd3-sankey';
import { schemeTableau10 } from 'd3-scale-chromatic';

import type { ApSankeyDiagramProps, SankeyNode, SankeyLink } from './ApSankeyDiagram.types';

const SankeyContainer = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  fontFamily: token.FontFamily.FontNormal,

  '& svg': {
    display: 'block',
    width: '100%',
    height: '100%',
  },

  '& .sankey-node': {
    transition: 'opacity 0.2s',
    cursor: 'pointer',

    '&:hover': {
      opacity: 0.8,
    },
  },

  '& .sankey-link': {
    transition: 'opacity 0.2s',
    mixBlendMode: 'multiply',
    cursor: 'pointer',

    '&:hover': {
      opacity: 0.7,
    },

    '&.selected': {
      opacity: 1,
      mixBlendMode: 'normal',
    },
  },

  '& .sankey-node-label': {
    fontSize: token.FontVariantToken.fontSizeS,
    fill: token.Colors.ColorForegroundLight,
    pointerEvents: 'none',
    userSelect: 'none',
  },

  '& .sankey-node-value': {
    fontSize: token.FontVariantToken.fontSizeS,
    fontWeight: token.FontFamily.FontWeightMedium,
    pointerEvents: 'none',
    userSelect: 'none',
  },
});

const LinkTooltipContent = styled(Paper)({
  backgroundColor: token.Colors.ColorBackgroundLight,
  border: `1px solid ${token.Colors.ColorBorderLight}`,
  borderRadius: token.Border.BorderRadiusM,
  padding: token.Spacing.SpacingM,
  minWidth: '200px',
  pointerEvents: 'none',

  '& .tooltip-row': {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${token.Spacing.SpacingXs} 0`,
    fontSize: token.FontVariantToken.fontSizeS,

    '&:not(:last-child)': {
      borderBottom: `1px solid ${token.Colors.ColorBorderGridLight}`,
    },
  },
  '& .tooltip-header': {
    fontSize: token.FontVariantToken.fontSizeM,
    fontWeight: token.FontFamily.FontWeightSemibold,
  },
  '& .tooltip-label': {
    color: token.Colors.ColorForegroundDeEmpLight,
    marginRight: token.Spacing.SpacingM,
  },
  '& .tooltip-value': {
    color: token.Colors.ColorForegroundLight,
    fontWeight: token.FontFamily.FontWeightSemibold,
  },
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
 *   height={400}
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

export const ApSankeyDiagram = React.forwardRef<HTMLDivElement, ApSankeyDiagramProps>(
  (props, ref) => {
    const {
      data,
      width = '100%',
      height = 800,
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
    const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    // Measure container width for responsive sizing
    useEffect(() => {
      if (typeof width === 'string' && containerRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setContainerWidth(entry.contentRect.width);
          }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
      return undefined;
    }, [width]);

    // Calculate actual dimensions
    const actualWidth = typeof width === 'number' ? width : containerWidth || 1200;
    const actualHeight = typeof height === 'number' ? height : 800;

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
          [1, 5],
          [actualWidth - 1, actualHeight - 5],
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
        const sourceColor = nodeColorMap.get(sourceNode.id) || colorScheme[0] || token.Colors.ColorGray500;
        const targetColor = nodeColorMap.get(targetNode.id) || colorScheme[1] || token.Colors.ColorGray500;

        // Calculate center position for tooltip
        const sourceX = sourceNode.x1 || 0;
        const targetX = targetNode.x0 || 0;
        const sourceY = link.y0 || 0;
        const targetY = link.y1 || 0;
        const centerX = (sourceX + targetX) / 2;
        const centerY = (sourceY + targetY) / 2;

        return {
          path: linkPathGenerator(link) || '',
          strokeWidth: Math.max(1, link.width || 0),
          color: (link as ExtendedSankeyLink).color,
          sourceColor,
          targetColor,
          gradientId: `sankey-gradient-${index}`,
          link,
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          sourceLabel: sourceNode.label,
          targetLabel: targetNode.label,
          centerX,
          centerY,
        };
      });
    }, [sankeyGraph, nodeColorMap, colorScheme]);

    // Generate node data for rendering
    const nodeData = useMemo(() => {
      if (!sankeyGraph) return [];
      return sankeyGraph.nodes.map((node, index) => {
        const extNode = node as ExtendedSankeyNode;
        const x0 = extNode.x0 || 0;
        const x1 = extNode.x1 || 0;
        const y0 = extNode.y0 || 0;
        const y1 = extNode.y1 || 0;
        const isLeftSide = x0 < actualWidth / 2;

        return {
          node: extNode,
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
          color: nodeColorMap.get(extNode.id) || colorScheme[index % colorScheme.length],
          labelX: isLeftSide ? x1 + parseInt(token.Spacing.SpacingXs) : x0 - parseInt(token.Spacing.SpacingXs),
          labelY: (y0 + y1) / 2,
          labelAnchor: (isLeftSide ? 'start' : 'end') as 'start' | 'end',
          value: extNode.value || 0,
        };
      });
    }, [sankeyGraph, nodeColorMap, colorScheme, actualWidth]);

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
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          containerRef.current = node;
        }}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
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
          <g className="sankey-links">
            {linkPaths.map((linkData, index) => {
              // Check if this link is connected to the hovered node
              const isConnectedToHoveredNode = connectedLinkIndices.has(index);

              // Determine opacity based on hover state
              let opacity = 0.5;
              if (selectedLinkIndex === index) {
                opacity = 1;
              } else if (hoveredNodeId) {
                opacity = isConnectedToHoveredNode ? 1 : 0.25;
              }

              return (
                <path
                  key={`link-${index}`}
                  d={linkData.path}
                  className={`sankey-link ${selectedLinkIndex === index || isConnectedToHoveredNode ? 'selected' : ''}`}
                  stroke={linkData.color ? linkData.color : `url(#${linkData.gradientId})`}
                  strokeWidth={linkData.strokeWidth}
                  fill="none"
                  opacity={opacity}
                  onMouseEnter={() => handleLinkMouseEnter(index, linkData.centerX, linkData.centerY)}
                  onMouseLeave={handleLinkMouseLeave}
                  onClick={(e) => onLinkClick?.(linkData.link as SankeyLink, e)}
                  aria-label={`Link from ${linkData.sourceLabel} to ${linkData.targetLabel}`}
                />
              );
            })}
          </g>

          {/* Render nodes */}
          <g className="sankey-nodes">
            {nodeData.map((nodeItem) => {
              // Determine node opacity based on hover state
              const nodeOpacity = hoveredNodeId
                ? hoveredNodeId === nodeItem.node.id ? 1 : 0.4
                : 1;

              return (
                <g key={`node-${nodeItem.node.id}`}>
                  {/* Node rectangle */}
                  <rect
                    x={nodeItem.x}
                    y={nodeItem.y}
                    width={nodeItem.width}
                    height={nodeItem.height}
                    fill={nodeItem.color}
                    className="sankey-node"
                    opacity={nodeOpacity}
                    onMouseEnter={() => handleNodeMouseEnter(nodeItem.node.id)}
                    onMouseLeave={handleNodeMouseLeave}
                    onClick={(e) => onNodeClick?.(nodeItem.node as SankeyNode, e)}
                  />

                {/* Node label */}
                <text
                  x={nodeItem.labelX}
                  y={nodeItem.labelY}
                  dy="0.35em"
                  textAnchor={nodeItem.labelAnchor}
                  className="sankey-node-label"
                >
                  {nodeItem.node.label}
                </text>

                {/* Node value */}
                {nodeItem.value > 0 && (
                  <text
                    x={nodeItem.labelX}
                    y={nodeItem.labelY + parseInt(token.Spacing.SpacingM)}
                    dy="0.35em"
                    textAnchor={nodeItem.labelAnchor}
                    className="sankey-node-value"
                  >
                    {nodeItem.value}
                  </text>
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
                const link = linkPath.link as SankeyLink;
                const metadata = link.metadata || {};

                return (
                  <>
                    <div className="tooltip-row">
                      <span className="tooltip-header">
                        {linkPath.sourceLabel} → {linkPath.targetLabel}
                      </span>
                    </div>
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="tooltip-row">
                        <span className="tooltip-label">{key}</span>
                        <span className="tooltip-value">{String(value)}</span>
                      </div>
                    ))}
                    {Object.keys(metadata).length === 0 && (
                      <div className="tooltip-row">
                        <span className="tooltip-label">Value</span>
                        <span className="tooltip-value">{link.value}</span>
                      </div>
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
