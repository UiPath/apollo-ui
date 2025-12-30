import type { ReactFlowInstance, Viewport, Node } from '@uipath/uix/xyflow/react';
import {
  animateViewport,
  animateDrillIn,
  animateDrillOut,
  calculateNodeFocusViewport,
  getCanvasSize,
  type NodeBounds,
  TRANSITION_CONFIG,
  ANIMATION_CONSTANTS,
} from '../utils/transitions';

/**
 * Represents different types of viewport transitions
 */
export type TransitionType = 'drill-in' | 'drill-out' | 'viewport' | 'none';

/**
 * State of the viewport transition
 */
export interface TransitionState {
  isTransitioning: boolean;
  type: TransitionType;
  startTime: number;
  progress: number;
  fromViewport?: Viewport;
  toViewport?: Viewport;
}

/**
 * Enhanced viewport manager that handles smooth animated transitions
 * for drilling in/out of canvas levels and general viewport changes
 */
class AnimatedViewportManager {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private currentViewport: Viewport = { x: 0, y: 0, zoom: 1 };
  private transitionState: TransitionState = {
    isTransitioning: false,
    type: 'none',
    startTime: 0,
    progress: 0,
  };
  private transitionTimeoutId?: number;

  // Callbacks for transition events
  private onTransitionStart?: (type: TransitionType) => void;
  private onTransitionUpdate?: (state: TransitionState) => void;
  private onTransitionComplete?: (type: TransitionType) => void;

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

  /**
   * Get current transition state
   */
  getTransitionState(): TransitionState {
    return { ...this.transitionState };
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this.transitionState.isTransitioning;
  }

  /**
   * Set event callbacks for transition lifecycle
   */
  setTransitionCallbacks(callbacks: {
    onStart?: (type: TransitionType) => void;
    onUpdate?: (state: TransitionState) => void;
    onComplete?: (type: TransitionType) => void;
  }) {
    this.onTransitionStart = callbacks.onStart;
    this.onTransitionUpdate = callbacks.onUpdate;
    this.onTransitionComplete = callbacks.onComplete;
  }

  /**
   * Update transition state and notify listeners
   */
  private updateTransitionState(updates: Partial<TransitionState>) {
    this.transitionState = { ...this.transitionState, ...updates };

    if (this.onTransitionUpdate) {
      this.onTransitionUpdate(this.transitionState);
    }
  }

  /**
   * Start a transition and update state
   */
  private startTransition(type: TransitionType, fromViewport: Viewport, toViewport: Viewport) {
    this.updateTransitionState({
      isTransitioning: true,
      type,
      startTime: performance.now(),
      progress: 0,
      fromViewport,
      toViewport,
    });

    if (this.onTransitionStart) {
      this.onTransitionStart(type);
    }

    // Set timeout to force completion if transition gets stuck
    this.clearTransitionTimeout();
    this.transitionTimeoutId = window.setTimeout(() => {
      if (this.isTransitioning()) {
        console.warn(
          `AnimatedViewportManager: Transition timeout after ${ANIMATION_CONSTANTS.TRANSITION_TIMEOUT}ms, forcing completion`
        );
        this.completeTransition();
      }
    }, ANIMATION_CONSTANTS.TRANSITION_TIMEOUT);
  }

  /**
   * Complete a transition and reset state
   */
  private completeTransition() {
    const type = this.transitionState.type;

    this.clearTransitionTimeout();

    this.updateTransitionState({
      isTransitioning: false,
      type: 'none',
      progress: 1,
    });

    if (this.onTransitionComplete) {
      this.onTransitionComplete(type);
    }
  }

  /**
   * Clear the transition timeout
   */
  private clearTransitionTimeout() {
    if (this.transitionTimeoutId !== undefined) {
      window.clearTimeout(this.transitionTimeoutId);
      this.transitionTimeoutId = undefined;
    }
  }

  /**
   * Smoothly animates to a target viewport
   */
  async animateToViewport(
    targetViewport: Viewport,
    duration?: number,
    type: TransitionType = 'viewport'
  ): Promise<void> {
    if (!this.reactFlowInstance) {
      console.warn(
        'AnimatedViewportManager: No ReactFlow instance available for viewport animation'
      );
      return;
    }

    if (this.isTransitioning()) {
      console.warn(
        'AnimatedViewportManager: Transition already in progress, skipping viewport animation'
      );
      return;
    }

    const fromViewport = this.getCurrentViewport();
    this.startTransition(type, fromViewport, targetViewport);

    try {
      await animateViewport(
        fromViewport,
        targetViewport,
        duration,
        (viewport) => {
          // Update ReactFlow viewport
          this.reactFlowInstance?.setViewport(viewport, { duration: 0 });

          // Update progress
          const elapsed = performance.now() - this.transitionState.startTime;
          const totalDuration = (duration || TRANSITION_CONFIG.viewportDuration) * 1000;
          const progress = Math.min(1, elapsed / totalDuration);

          this.updateTransitionState({ progress });
        },
        () => {
          this.currentViewport = targetViewport;
          this.completeTransition();
        }
      );
    } catch (error) {
      console.error('AnimatedViewportManager: Animation failed', error);
      this.completeTransition();
    }
  }

  /**
   * Performs a drill-in transition by smoothly zooming to focus on a node
   * Note: The child canvas viewport will be restored after the animation by HierarchicalCanvas
   */
  async drillIntoNode(node: Node): Promise<void> {
    if (!this.reactFlowInstance) {
      console.warn('AnimatedViewportManager: No ReactFlow instance available for drill-in');
      return;
    }

    if (this.isTransitioning()) {
      console.warn('AnimatedViewportManager: Transition already in progress, skipping drill-in');
      return;
    }

    // Get canvas container size from ReactFlow DOM element
    const canvasElement = document.querySelector('.react-flow') as HTMLElement;
    const canvasSize = getCanvasSize(canvasElement);

    // Calculate node bounds
    const nodeBounds: NodeBounds = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 100,
    };

    // Calculate the viewport that focuses on the node with padding
    const nodeFocusViewport = calculateNodeFocusViewport(
      nodeBounds,
      canvasSize,
      ANIMATION_CONSTANTS.NODE_FOCUS_PADDING
    );

    const fromViewport = this.getCurrentViewport();

    this.startTransition('drill-in', fromViewport, nodeFocusViewport);

    try {
      // Animate zoom to node focus
      await animateDrillIn(fromViewport, nodeFocusViewport, (viewport) => {
        this.reactFlowInstance?.setViewport(viewport, { duration: 0 });

        // Update progress
        const elapsed = performance.now() - this.transitionState.startTime;
        const totalDuration = TRANSITION_CONFIG.drillDuration * 1000;
        const progress = Math.min(1, elapsed / totalDuration);

        this.updateTransitionState({ progress });
      });

      this.currentViewport = nodeFocusViewport;
      this.completeTransition();
    } catch (error) {
      console.error(
        `AnimatedViewportManager: Drill-in animation failed for node ${node.id}:`,
        error
      );
      this.completeTransition();
    }
  }

  /**
   * Performs a drill-out transition back to parent canvas
   */
  async drillOutToParent(parentViewport: Viewport): Promise<void> {
    if (!this.reactFlowInstance) {
      console.warn('AnimatedViewportManager: No ReactFlow instance available for drill-out');
      return;
    }

    if (this.isTransitioning()) {
      console.warn('AnimatedViewportManager: Transition already in progress, skipping drill-out');
      return;
    }

    const fromViewport = this.getCurrentViewport();
    this.startTransition('drill-out', fromViewport, parentViewport);

    try {
      // Clean drill-out animation
      await animateDrillOut(fromViewport, parentViewport, (viewport) => {
        this.reactFlowInstance?.setViewport(viewport, { duration: 0 });

        const elapsed = performance.now() - this.transitionState.startTime;
        const totalDuration = TRANSITION_CONFIG.drillDuration * 1000;
        const progress = Math.min(1, elapsed / totalDuration);

        this.updateTransitionState({ progress });
      });

      this.currentViewport = parentViewport;
      this.completeTransition();
    } catch (error) {
      console.error('AnimatedViewportManager: Drill-out animation failed', error);
      this.completeTransition();
    }
  }

  /**
   * Immediately set viewport without animation (for initialization)
   */
  setViewportImmediate(viewport: Viewport) {
    if (this.reactFlowInstance) {
      this.reactFlowInstance.setViewport(viewport, { duration: 0 });
    }
    this.currentViewport = viewport;
  }

  /**
   * Get node bounds from the ReactFlow instance
   */
  getNodeBounds(nodeId: string): NodeBounds | null {
    if (!this.reactFlowInstance) return null;

    const node = this.reactFlowInstance.getNode(nodeId);
    if (!node) return null;

    return {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 100,
    };
  }

  /**
   * Cancel any ongoing transition
   */
  cancelTransition() {
    if (this.isTransitioning()) {
      console.warn('AnimatedViewportManager: Cancelling active transition');
      this.completeTransition();
    }
  }

  /**
   * Cleanup on manager destruction
   */
  destroy() {
    this.clearTransitionTimeout();
    this.cancelTransition();
    this.reactFlowInstance = null;
  }
}

// Export singleton instance
export const animatedViewportManager = new AnimatedViewportManager();
