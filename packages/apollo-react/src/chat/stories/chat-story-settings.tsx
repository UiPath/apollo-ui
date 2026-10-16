import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

function StorySettingsPage({ opening }: { opening: number }) {
  const [saved, setSaved] = React.useState(0);

  return (
    <div style={{ color: 'var(--color-foreground)', fontSize: 14, lineHeight: 1.5 }}>
      <p style={{ margin: '0 0 16px' }}>
        A React root mounted by the host into the settings container, as CAS does. This is opening{' '}
        {opening}: the container is emptied on close and handed to the renderer again on the next
        opening.
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input type="checkbox" defaultChecked /> Auto-scroll to new messages
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input type="checkbox" /> Sound notifications
      </label>
      <button
        type="button"
        onClick={() => setSaved((count) => count + 1)}
        style={{
          padding: '6px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          background: 'transparent',
          color: 'var(--color-foreground)',
          cursor: 'pointer',
        }}
      >
        Save ({saved})
      </button>
    </div>
  );
}

/**
 * A `settingsRenderer` that mounts a React root, as CAS does. Each opening mounts a fresh root in
 * a child of the container; the previous one, whose DOM the chat already removed, is unmounted.
 */
export function createStoryReactSettingsRenderer() {
  let root: Root | undefined;
  let openings = 0;

  return (container: HTMLElement) => {
    const previous = root;
    // Unmounting a root during another root's effects warns, so after them.
    queueMicrotask(() => previous?.unmount());

    openings += 1;
    const host = document.createElement('div');
    container.appendChild(host);
    root = createRoot(host);
    root.render(<StorySettingsPage opening={openings} />);
  };
}
