"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import type { ReactNode } from 'react';
import { SidebarFooter } from './SidebarFooter';

interface SplitViewLayoutProps {
  validationPanel?: ReactNode;
  documentArea?: ReactNode;
  leftDocument?: ReactNode;
  rightDocument?: ReactNode;
}

export function SplitViewLayout({
  validationPanel,
  documentArea,
  leftDocument,
  rightDocument,
}: SplitViewLayoutProps) {
  // If validationPanel is provided, render the main layout with sidebar
  if (validationPanel) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-secondary via-background to-background relative overflow-hidden">
        {/* Decorative ellipse background */}
        <div
          className="absolute pointer-events-none opacity-10"
          style={{
            top: '-57px',
            right: '-200px',
            width: '888px',
            height: '934px',
            background:
              'radial-gradient(ellipse, rgba(100, 200, 255, 0.3) 0%, transparent 70%)',
            transform: 'rotateY(180deg)',
          }}
        />

        <ResizablePanelGroup direction="horizontal" className="relative z-10">
          {/* Validation Checklist Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full bg-background/80 border-r border-border flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {validationPanel}
              </div>
              <SidebarFooter
                title="Compliance category"
                currentIndex={1}
                totalCount={6}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Documents Area */}
          <ResizablePanel defaultSize={75}>
            {documentArea}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Otherwise, render just the document split view
  return (
    <div className="h-full bg-secondary px-2 pt-2 pb-2">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Document */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full pr-4">
            {leftDocument}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Document */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full pl-4">
            {rightDocument}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
