// Internal: not exported from the hooks barrel.
import type { ToolbarActionStore } from './ToolbarActionContext';

export interface MountedCanvas {
  store: ToolbarActionStore;
}

// Mounted canvases, oldest first.
const mountedCanvases: MountedCanvas[] = [];

export function addMountedCanvas(entry: MountedCanvas): void {
  mountedCanvases.push(entry);
}

export function removeMountedCanvas(entry: MountedCanvas): void {
  const index = mountedCanvases.indexOf(entry);
  if (index !== -1) {
    mountedCanvases.splice(index, 1);
  }
}

export function newestMountedCanvas(): MountedCanvas | undefined {
  return mountedCanvases[mountedCanvases.length - 1];
}
