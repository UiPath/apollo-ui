export const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
export const ENTRANCE_INITIAL = { opacity: 0, y: 8 };
export const ENTRANCE_ANIMATE = { opacity: 1, y: 0 };

export const POP_INITIAL = { opacity: 0, y: 4, scale: 0.96 };
export const POP_ANIMATE = { opacity: 1, y: 0, scale: 1 };
export const POP_EXIT = { opacity: 0, y: 4, scale: 0.96 };
export const POP_TRANSITION = { duration: 0.14, ease: ENTRANCE_EASE };
