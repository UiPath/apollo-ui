# CanvasDndContext Usage Guide

This guide explains how to use `CanvasDndContext` to enable drag-and-drop functionality across multiple canvas nodes, including cross-stage task dragging.

## Overview

`CanvasDndContext` provides a shared drag-and-drop context for all draggable elements in the canvas. It allows:
- ✅ Tasks to be dragged within the same stage (existing functionality preserved)
- ✅ **Tasks to be dragged between different stages (new functionality)**
- ✅ Different node types to register their own drag handlers
- ✅ Global drag event handling at the canvas level

## Architecture

```
CanvasDndContext (shared DndContext)
  └─ BaseCanvas
      ├─ StageNode 1 (SortableContext)
      │   └─ Tasks (draggable)
      ├─ StageNode 2 (SortableContext)
      │   └─ Tasks (draggable)
      └─ StageNode 3 (SortableContext)
          └─ Tasks (draggable)
```

## Basic Setup

### 1. Wrap Your Canvas

Wrap your canvas component with `CanvasDndContext`:

```tsx
import { CanvasDndContext } from '@uipath/apollo-react';

<CanvasDndContext>
  <BaseCanvas nodes={nodes} edges={edges}>
    {/* Your canvas nodes */}
  </BaseCanvas>
</CanvasDndContext>
```

### 2. Register Node-Specific Handlers

Inside your custom node components, use `useCanvasDndHandler`:

```tsx
import { useCanvasDndHandler } from '@uipath/apollo-react';

const MyCustomNode = () => {
  useCanvasDndHandler('my-node-type', {
    onDragStart: (event) => {
      console.log('Drag started:', event.active.id);
    },
    onDragEnd: (event) => {
      // Handle node-specific drag end logic
    },
  });

  return <div>My Node</div>;
};
```

### 3. Pass NodeType in Draggable Data

When using `useSortable`, pass the nodeType in the data:

```tsx
const { attributes, listeners, setNodeRef } = useSortable({
  id: item.id,
  data: {
    nodeType: 'my-node-type', // Important!
  },
});
```

## Cross-Stage Dragging Implementation

### State Management Pattern

```tsx
const [stages, setStages] = useState([
  {
    id: 'stage-1',
    label: 'Application',
    tasks: [
      [{ id: 'task-1', label: 'KYC Check' }],
      [{ id: 'task-2', label: 'Document Review' }],
    ]
  },
  {
    id: 'stage-2',
    label: 'Processing',
    tasks: [
      [{ id: 'task-3', label: 'Credit Check' }],
    ]
  },
]);
```

### Global Drag Handler

Implement a global `onDragEnd` handler to detect and handle cross-stage movements:

```tsx
const handleGlobalDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  // 1. Find which stages contain the dragged task and drop target
  const sourceStageId = findStageWithTask(stages, activeId);
  const targetStageId = findStageWithTask(stages, overId);

  if (!sourceStageId || !targetStageId) return;

  // 2. If same stage, let StageNode handle it
  if (sourceStageId === targetStageId) return;

  // 3. Handle cross-stage movement
  setStages(currentStages => {
    // Remove task from source stage
    const { updatedTasks: newSourceTasks, removedTask } =
      removeTaskFromStage(sourceStage.tasks, activeId);

    if (!removedTask) return currentStages;

    // Add task to target stage at appropriate position
    const newTargetTasks = addTaskToStage(
      targetStage.tasks,
      removedTask,
      overId
    );

    // Update both stages
    return currentStages.map(stage => {
      if (stage.id === sourceStageId) {
        return { ...stage, tasks: newSourceTasks };
      }
      if (stage.id === targetStageId) {
        return { ...stage, tasks: newTargetTasks };
      }
      return stage;
    });
  });
}, [stages]);
```

### Use the Context

```tsx
<CanvasDndContext onDragEnd={handleGlobalDragEnd}>
  <BaseCanvas nodes={nodes} edges={edges}>
    {stages.map(stage => (
      <StageNode
        key={stage.id}
        stageDetails={stage}
        onTaskReorder={(reorderedTasks) => {
          // Handle within-stage reordering
          updateStage(stage.id, { tasks: reorderedTasks });
        }}
      />
    ))}
  </BaseCanvas>
</CanvasDndContext>
```

## Helper Functions

### Finding Tasks Across Stages

```tsx
function findStageWithTask(
  stages: Stage[],
  taskId: string
): string | null {
  for (const stage of stages) {
    const hasTask = stage.tasks
      .flat()
      .some(task => task.id === taskId);
    if (hasTask) return stage.id;
  }
  return null;
}
```

### Removing Tasks from a Stage

```tsx
function removeTaskFromStage(
  tasks: Task[][],
  taskId: string
): { updatedTasks: Task[][], removedTask: Task | null } {
  let removedTask: Task | null = null;

  const updatedTasks = tasks
    .map(group => {
      const task = group.find(t => t.id === taskId);
      if (task) removedTask = task;
      return group.filter(t => t.id !== taskId);
    })
    .filter(group => group.length > 0);

  return { updatedTasks, removedTask };
}
```

### Adding Tasks to a Stage

```tsx
function addTaskToStage(
  tasks: Task[][],
  task: Task,
  targetTaskId: string
): Task[][] {
  // Find target position
  let targetGroupIndex = -1;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].some(t => t.id === targetTaskId)) {
      targetGroupIndex = i;
      break;
    }
  }

  if (targetGroupIndex === -1) {
    return [...tasks, [task]];
  }

  // Insert after target group
  const newTasks = [...tasks];
  newTasks.splice(targetGroupIndex + 1, 0, [task]);
  return newTasks;
}
```

## Advanced Features

### Global Event Handlers

You can register global handlers that run for ALL drag events:

```tsx
<CanvasDndContext
  onDragStart={(event) => {
    console.log('Global: drag started');
    // Analytics, state updates, etc.
  }}
  onDragMove={(event) => {
    // Track drag movement
  }}
  onDragOver={(event) => {
    // Handle hover effects
  }}
  onDragEnd={(event) => {
    // Handle cross-stage movements
  }}
  onDragCancel={() => {
    // Reset state
  }}
>
  <BaseCanvas />
</CanvasDndContext>
```

### Custom Sensors

Override the default sensors if needed:

```tsx
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Custom activation distance
    },
  })
);

<CanvasDndContext sensors={sensors}>
  <BaseCanvas />
</CanvasDndContext>
```

### Custom Collision Detection

```tsx
import { rectIntersection } from '@dnd-kit/core';

<CanvasDndContext collisionDetection={rectIntersection}>
  <BaseCanvas />
</CanvasDndContext>
```

## Event Handler Composition

The context composes handlers in this order:

1. **Global handler** runs first (from `CanvasDndContext` props)
2. **Node-specific handler** runs second (from `useCanvasDndHandler`)

Both handlers run - neither prevents the other from executing.

## Multiple Node Types

You can register different handlers for different node types:

```tsx
// In StageNode component
useCanvasDndHandler('stage-node', {
  onDragEnd: (event) => { /* stage-specific logic */ }
});

// In TriggerNode component
useCanvasDndHandler('trigger-node', {
  onDragEnd: (event) => { /* trigger-specific logic */ }
});

// In GroupNode component
useCanvasDndHandler('group-node', {
  onDragEnd: (event) => { /* group-specific logic */ }
});
```

## Important Notes

### First Registration Wins

If the same `nodeType` registers multiple times, **only the first registration is kept**. This prevents conflicts when the same node type appears multiple times in the canvas.

### DragOverlay Rendering

Each node component is responsible for rendering its own `DragOverlay`:

```tsx
const MyNode = () => {
  const [activeId, setActiveId] = useState(null);

  useCanvasDndHandler('my-node', {
    onDragStart: (event) => setActiveId(event.active.id),
    onDragEnd: () => setActiveId(null),
  });

  return (
    <>
      <SortableContext items={items}>
        {/* draggable items */}
      </SortableContext>

      {createPortal(
        <DragOverlay>
          {activeId ? <MyDragPreview id={activeId} /> : null}
        </DragOverlay>,
        document.body
      )}
    </>
  );
};
```

### Within-Stage vs Cross-Stage Logic

- **Within-stage reordering**: Handled by `StageNode`'s `onTaskReorder` callback
- **Cross-stage movement**: Handled by global `onDragEnd` in `CanvasDndContext`

The global handler should check if source and target are in the same stage and skip processing if they are (let the node handle it).

## Example: Complete Implementation

See `CrossStageDraggingStory.tsx` for a complete working example that demonstrates:
- Multiple stages with tasks
- Cross-stage dragging
- Within-stage reordering
- State management
- Helper functions

## Troubleshooting

### Tasks can't be dragged between stages

- ✅ Ensure `CanvasDndContext` wraps all stage nodes
- ✅ Check that `nodeType` is passed in `useSortable` data
- ✅ Verify global `onDragEnd` handler is registered
- ✅ Make sure stage detection logic finds both source and target

### Handlers not firing

- ✅ Verify `useCanvasDndHandler` is called during component render
- ✅ Check that the `nodeType` in `useSortable` matches the one in `useCanvasDndHandler`
- ✅ Ensure handlers are not undefined or null

### Multiple drag overlays appearing

- ✅ Each `DragOverlay` should check if its node type is active
- ✅ Use the context's `activeNodeType` to conditionally render overlays

## API Reference

See the TypeScript type definitions in `types.ts` for complete API documentation.
