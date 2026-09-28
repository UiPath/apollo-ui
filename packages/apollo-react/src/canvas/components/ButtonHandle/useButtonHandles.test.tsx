import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { HandleGroupManifest } from '../../schema/node-definition';
import type { ResolvedHandleGroup } from '../../utils/manifest-resolver';
import { useButtonHandles } from './useButtonHandles';

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  useNodesData: () => ({}),
}));

// canvas-mocks.ts globally mocks @uipath/apollo-react/canvas/xyflow/react with a
// Handle that ignores its children — override here so the inline + button (rendered
// inside <Handle>) actually mounts.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return {
    ...actual,
    // biome-ignore lint/suspicious/noExplicitAny: lightweight Handle stub for tests
    Handle: ({ children, ...props }: any) => {
      const domProps = Object.keys(props).reduce((acc: Record<string, unknown>, key) => {
        if (!key.startsWith('$')) acc[key] = props[key];
        return acc;
      }, {});
      return (
        <div data-testid="handle" {...domProps}>
          {children}
        </div>
      );
    },
  };
});

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => new Set<string>(),
}));

// Pass the manifest groups straight through as ResolvedHandle-shaped objects so
// per-handle `onMouseEnter`/`onMouseLeave`/`onAction` survive into useButtonHandles.
vi.mock('../../utils/manifest-resolver', () => ({
  resolveHandles: (groups: ResolvedHandleGroup[]) =>
    (groups ?? []).map((group) => ({
      ...group,
      visible: group.visible ?? true,
      handles: group.handles.map((h) => ({
        ...h,
        visible: h.visible ?? true,
      })),
    })),
}));

function TestHost({
  handleConfigurations,
  handleMouseEnter,
  handleMouseLeave,
}: {
  // Cast through unknown — the test passes resolved-shaped objects (with
  // onAction/onMouseEnter) and our mock above forwards them as-is, which is
  // exactly what useButtonHandles consumes at runtime.
  handleConfigurations: HandleGroupManifest[];
  handleMouseEnter?: (event: { handleId: string; nodeId: string }) => void;
  handleMouseLeave?: (event: { handleId: string; nodeId: string }) => void;
}) {
  const elements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles: true,
    handleMouseEnter,
    handleMouseLeave,
    nodeId: 'test-node',
    selected: true,
    hovered: true,
    showAddButton: true,
  });

  return <>{elements}</>;
}

// biome-ignore lint/suspicious/noExplicitAny: per-handle resolved fields are runtime additions on top of the schema-derived HandleManifest
function makeGroups(handles: any[]): HandleGroupManifest[] {
  return [
    {
      position: Position.Right,
      handles,
    },
  ] as HandleGroupManifest[];
}

describe('useButtonHandles — handler precedence', () => {
  it('uses per-handle onMouseEnter when both per-handle and global are provided', async () => {
    const user = userEvent.setup();
    const perHandleOnMouseEnter = vi.fn();
    const globalOnMouseEnter = vi.fn();

    const handleConfigurations = makeGroups([
      {
        id: 'output',
        type: 'source',
        handleType: 'output',
        showButton: true,
        onAction: () => {},
        onMouseEnter: perHandleOnMouseEnter,
      },
    ]);

    render(
      <TestHost handleConfigurations={handleConfigurations} handleMouseEnter={globalOnMouseEnter} />
    );

    const button = screen.getByRole('button');
    await user.hover(button);

    expect(perHandleOnMouseEnter).toHaveBeenCalledOnce();
    expect(globalOnMouseEnter).not.toHaveBeenCalled();
  });

  it('falls back to the global handleMouseEnter when per-handle is unset', async () => {
    const user = userEvent.setup();
    const globalOnMouseEnter = vi.fn();

    const handleConfigurations = makeGroups([
      {
        id: 'output',
        type: 'source',
        handleType: 'output',
        showButton: true,
        onAction: () => {},
      },
    ]);

    render(
      <TestHost handleConfigurations={handleConfigurations} handleMouseEnter={globalOnMouseEnter} />
    );

    const button = screen.getByRole('button');
    await user.hover(button);

    expect(globalOnMouseEnter).toHaveBeenCalledOnce();
    expect(globalOnMouseEnter).toHaveBeenCalledWith(
      expect.objectContaining({ handleId: 'output', nodeId: 'test-node' })
    );
  });

  it('uses per-handle onMouseLeave when both per-handle and global are provided', async () => {
    const user = userEvent.setup();
    const perHandleOnMouseLeave = vi.fn();
    const globalOnMouseLeave = vi.fn();

    const handleConfigurations = makeGroups([
      {
        id: 'output',
        type: 'source',
        handleType: 'output',
        showButton: true,
        onAction: () => {},
        onMouseLeave: perHandleOnMouseLeave,
      },
    ]);

    render(
      <TestHost handleConfigurations={handleConfigurations} handleMouseLeave={globalOnMouseLeave} />
    );

    const button = screen.getByRole('button');
    await user.hover(button);
    await user.unhover(button);

    expect(perHandleOnMouseLeave).toHaveBeenCalledOnce();
    expect(globalOnMouseLeave).not.toHaveBeenCalled();
  });
});
