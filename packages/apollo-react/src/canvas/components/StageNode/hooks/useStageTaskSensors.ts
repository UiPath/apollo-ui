import {
  KeyboardCode,
  KeyboardSensor,
  type KeyboardSensorOptions,
  PointerSensor,
  type PointerSensorOptions,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const POINTER_OPTIONS: PointerSensorOptions = { activationConstraint: { distance: 3 } };

// Enter opens a task, so only Space picks one up. Enter still drops, as in dnd-kit's defaults.
const KEYBOARD_OPTIONS: KeyboardSensorOptions = {
  coordinateGetter: sortableKeyboardCoordinates,
  keyboardCodes: {
    start: [KeyboardCode.Space],
    cancel: [KeyboardCode.Esc],
    end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab],
  },
};

/** The sensors of every reorderable task section of a stage. */
export function useStageTaskSensors() {
  return useSensors(
    useSensor(PointerSensor, POINTER_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_OPTIONS)
  );
}
