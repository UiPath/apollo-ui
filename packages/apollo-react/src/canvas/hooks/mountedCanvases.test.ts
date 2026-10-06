import { describe, expect, it } from 'vitest';
import { addMountedCanvas, newestMountedCanvas, removeMountedCanvas } from './mountedCanvases';

describe('mountedCanvases', () => {
  it('keeps the other canvases when an entry is removed twice', () => {
    const a = { store: { mode: 'view' } };
    const b = { store: { mode: 'design' } };
    addMountedCanvas(a);
    addMountedCanvas(b);

    removeMountedCanvas(a);
    removeMountedCanvas(a);

    expect(newestMountedCanvas()).toBe(b);
    removeMountedCanvas(b);
    expect(newestMountedCanvas()).toBeUndefined();
  });

  it('ignores removing an entry that was never added', () => {
    const a = { store: { mode: 'view' } };
    addMountedCanvas(a);

    removeMountedCanvas({ store: { mode: 'design' } });

    expect(newestMountedCanvas()).toBe(a);
    removeMountedCanvas(a);
  });
});
