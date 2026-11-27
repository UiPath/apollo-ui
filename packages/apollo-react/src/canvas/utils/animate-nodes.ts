import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { BASE_CANVAS_DEFAULTS } from '../components/BaseCanvas/BaseCanvas.constants';
import { prefersReducedMotion } from './reduced-motion';

export interface AnimateNodesOptions<N extends Node = Node> {
  /** Milliseconds. 0 applies the targets in one update. Defaults to the canvas transition duration. */
  duration?: number;
  /** Maps linear progress (0 to 1) to eased progress. Defaults to ease-out cubic. */
  easing?: (t: number) => number;
  /** Called on every frame with the nodes, each moved part of the way to its target. */
  onUpdate: (nodes: N[]) => void;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Moves nodes from their current positions to target positions over a number of frames, so edges
 * follow the nodes instead of snapping ahead of them. Keep one animator per canvas: a new `animate`
 * call stops the run before it.
 *
 * A node absent from `targetNodes` keeps its current state, so a layout pass can send only the
 * nodes it moved. A node absent from `currentNodes` appears at its target from the first frame.
 * A target's other fields (size, style, parentId) apply from the first frame.
 */
export class NodeAnimator {
  private run: { frame: number; settle: (finished: boolean) => void } | null = null;

  get isAnimating(): boolean {
    return this.run !== null;
  }

  /**
   * Resolves with `true` when the nodes reach their targets, or `false` when `cancel` or a newer
   * `animate` call stopped the run first. Rejects when `onUpdate` or `easing` throws.
   */
  animate<N extends Node>(
    currentNodes: N[],
    targetNodes: N[],
    {
      duration = BASE_CANVAS_DEFAULTS.transitions.default.durationMs,
      easing = easeOutCubic,
      onUpdate,
    }: AnimateNodesOptions<N>
  ): Promise<boolean> {
    this.cancel();

    const targets = new Map(targetNodes.map((node) => [node.id, node]));
    const currentIds = new Set(currentNodes.map((node) => node.id));
    const added = targetNodes.filter((node) => !currentIds.has(node.id));
    const frameAt = (progress: number) => [
      ...currentNodes.map((node) => {
        const target = targets.get(node.id);
        if (!target) return node;
        const dx = target.position.x - node.position.x;
        const dy = target.position.y - node.position.y;
        // Unmoved nodes keep their identity, so memoized nodes skip the re-render.
        if (progress === 1 || (dx === 0 && dy === 0)) return target;
        return {
          ...target,
          position: { x: node.position.x + dx * progress, y: node.position.y + dy * progress },
        };
      }),
      ...added,
    ];

    if (duration <= 0 || prefersReducedMotion()) {
      try {
        onUpdate(frameAt(1));
      } catch (error) {
        return Promise.reject(error);
      }
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve, reject) => {
      const run = { frame: 0, settle: resolve };
      this.run = run;
      const start = performance.now();
      const step = (now: number) => {
        const linear = Math.min((now - start) / duration, 1);
        try {
          onUpdate(frameAt(linear === 1 ? 1 : easing(linear)));
        } catch (error) {
          if (this.run === run) this.run = null;
          reject(error);
          return;
        }
        // `onUpdate` may have cancelled this run or started another one.
        if (this.run !== run) return;
        if (linear < 1) {
          run.frame = requestAnimationFrame(step);
          return;
        }
        this.run = null;
        resolve(true);
      };
      run.frame = requestAnimationFrame(step);
    });
  }

  /** Stops on the current frame. The pending `animate` promise resolves with `false`. */
  cancel(): void {
    const run = this.run;
    if (!run) return;
    this.run = null;
    cancelAnimationFrame(run.frame);
    run.settle(false);
  }
}
