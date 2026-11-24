import {
  KeyboardSensor,
  type KeyboardSensorOptions,
  PointerSensor,
  type PointerSensorOptions,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const POINTER_OPTIONS: PointerSensorOptions = { activationConstraint: { distance: 3 } };

const KEYBOARD_OPTIONS: KeyboardSensorOptions = { coordinateGetter: sortableKeyboardCoordinates };

/** The sensors of a Text view's rule list: a pointer or touch press on a card's handle, or Space or Enter on it. */
export const useRuleSensors = () =>
  useSensors(
    useSensor(PointerSensor, POINTER_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_OPTIONS)
  );
