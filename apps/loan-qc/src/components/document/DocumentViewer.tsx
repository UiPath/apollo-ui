"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Document, DocumentHighlight } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  document: Document;
  highlights?: DocumentHighlight[];
}

const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const DEFAULT_ZOOM_INDEX = 0;

export function DocumentViewer({
  document,
  highlights = [],
}: DocumentViewerProps) {
  const [zoomedHighlight, setZoomedHighlight] = useState<DocumentHighlight | null>(null);
  const [manualZoomIndex, setManualZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleHighlightClick = (highlight: DocumentHighlight, e: React.MouseEvent) => {
    // Don't trigger highlight click if we were dragging
    if (isDragging) {
      e.stopPropagation();
      return;
    }

    if (zoomedHighlight?.id === highlight.id) {
      setZoomedHighlight(null);
      setDragOffset({ x: 0, y: 0 });
    } else {
      setZoomedHighlight(highlight);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoomedHighlight(null);
    setManualZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomedHighlight(null);
    setManualZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleZoomReset = () => {
    setZoomedHighlight(null);
    setManualZoomIndex(DEFAULT_ZOOM_INDEX);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only enable dragging when zoomed in
    const isZoomed = manualZoomIndex > 0 || zoomedHighlight !== null;
    if (!isZoomed) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Calculate zoom transform based on highlight position
  const getZoomTransform = (highlight: DocumentHighlight) => {
    const { x, y, width, height } = highlight.boundingBox;

    // Calculate center of the highlight
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Calculate scale to make the highlight area fill ~60% of viewport
    const targetWidthPercent = 60;
    const scale = targetWidthPercent / width;

    // Calculate translation to center the highlight
    // We need to translate so the center of the highlight is at viewport center (50%, 50%)
    const translateX = (50 - centerX) / (scale / 100);
    const translateY = (50 - centerY) / (scale / 100);

    return {
      scale: Math.min(scale, 3), // Cap maximum scale at 3x
      x: translateX,
      y: translateY,
    };
  };

  const baseZoom = zoomedHighlight
    ? getZoomTransform(zoomedHighlight)
    : { scale: ZOOM_LEVELS[manualZoomIndex], x: 0, y: 0 };

  // Add drag offset to the transform
  const currentZoom = {
    scale: baseZoom.scale,
    x: baseZoom.x + dragOffset.x,
    y: baseZoom.y + dragOffset.y,
  };

  const canZoomIn = manualZoomIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = manualZoomIndex > 0;
  const isZoomedOut = manualZoomIndex === DEFAULT_ZOOM_INDEX && !zoomedHighlight;
  const isZoomed = !isZoomedOut;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative h-full flex flex-col mt-9">
        {/* Scrollable Container - scrollbar sits outside */}
        <div className="relative flex-1 overflow-y-auto">
          {/* Document Container with border */}
          <div
            className="relative w-full border border-border rounded-lg bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            <motion.div
              className="relative w-full origin-center"
              animate={currentZoom}
              transition={{
                duration: isDragging ? 0 : 0.6,
                ease: [0.4, 0, 0.2, 1], // Custom bezier curve for smooth animation
              }}
            >
              {/* Document Image */}
              <img
                src={document.imageUrl}
                alt={document.name}
                className="w-full h-auto opacity-90"
              />

              {/* Highlights Overlay */}
              {highlights.map((highlight) => (
                <Tooltip key={highlight.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute pointer-events-auto cursor-zoom-in transition-opacity hover:opacity-80"
                      style={{
                        left: `${highlight.boundingBox.x}%`,
                        top: `${highlight.boundingBox.y}%`,
                        width: `${highlight.boundingBox.width}%`,
                        height: `${highlight.boundingBox.height}%`,
                        backgroundColor: highlight.color,
                        border: `1px solid rgba(36, 175, 191, 0.5)`,
                        borderRadius: '6px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHighlightClick(highlight, e);
                      }}
                    />
                  </TooltipTrigger>
                  {highlight.label && (
                    <TooltipContent>
                      <p>{highlight.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Floating Zoom Controls - Positioned outside scrollable area */}
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1 z-10 pointer-events-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={!canZoomIn}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom in</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomReset}
                disabled={isZoomedOut}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom to fit</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={!canZoomOut && isZoomedOut}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom out</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
