import {
  type ReactFlowState,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { type ContainerResizeMinimums, getContainerResizeMinimums } from '../../utils/container';
import { DEFAULT_RESIZE_MINIMUMS } from './ContainerNode.constants';
import type { ContainerHandleGroup } from './ContainerNode.helpers';

export function resolveInteractionState(
  dragging: boolean,
  selected: boolean,
  isHovered: boolean
): 'drag' | 'selected' | 'hover' | 'default' {
  if (dragging) return 'drag';
  if (selected) return 'selected';
  if (isHovered) return 'hover';
  return 'default';
}

export function useHasChildNodes(id: string, enabled: boolean): boolean {
  return useStore(
    useCallback(
      (state: ReactFlowState) => !enabled || (state.parentLookup.get(id)?.size ?? 0) > 0,
      [id, enabled]
    )
  );
}

export function useContainerResizeMinimums(
  id: string,
  width: number,
  height: number,
  enabled: boolean
): ContainerResizeMinimums {
  return useStore(
    useCallback(
      (state: ReactFlowState) => {
        if (!enabled) {
          return DEFAULT_RESIZE_MINIMUMS;
        }

        return getContainerResizeMinimums(
          { id, width, height },
          Array.from(state.parentLookup.get(id)?.values() ?? [])
        );
      },
      [enabled, height, id, width]
    ),
    shallow
  );
}

export function useContainerNodeInternalsRefresh(
  id: string,
  handleGroups: ContainerHandleGroup[],
  width: number,
  height: number
) {
  const updateNodeInternals = useUpdateNodeInternals();

  // biome-ignore lint/correctness/useExhaustiveDependencies: dimensions and resolved handle groups are intentional rerun triggers for React Flow internals recalculation
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      updateNodeInternals(id);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [id, handleGroups, updateNodeInternals, width, height]);
}

/** Match BaseNode priority: data override, then manifest defaults. */
export function resolveContainerHandleConfigurations(
  manifestHandleConfigurations: HandleGroupManifest[] | undefined,
  data: Record<string, unknown>
): HandleGroupManifest[] {
  if (Array.isArray(data.handleConfigurations)) {
    return data.handleConfigurations as HandleGroupManifest[];
  }

  return manifestHandleConfigurations ?? [];
}
