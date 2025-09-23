import type { ReactFlowInstance, Viewport } from "@uipath/uix/xyflow/react";

class ViewportManager {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private currentViewport: Viewport = { x: 0, y: 0, zoom: 1 };

  setReactFlowInstance(instance: ReactFlowInstance | null) {
    this.reactFlowInstance = instance;
  }

  getReactFlowInstance(): ReactFlowInstance | null {
    return this.reactFlowInstance;
  }

  setCurrentViewport(viewport: Viewport) {
    this.currentViewport = viewport;
  }

  getCurrentViewport(): Viewport {
    if (this.reactFlowInstance) {
      return this.reactFlowInstance.getViewport();
    }
    return this.currentViewport;
  }

  restoreViewport(viewport: Viewport) {
    if (this.reactFlowInstance) {
      this.reactFlowInstance.setViewport(viewport);
    }
  }
}

export const viewportManager = new ViewportManager();
