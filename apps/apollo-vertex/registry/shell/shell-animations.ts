export const sidebarSpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.5,
} as const;

export const fastFadeTransition = {
  duration: 0.15,
  ease: [0.25, 0.46, 0.45, 0.94],
} as const;

export const textFadeVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0 },
};

export const iconHoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

export const scaleVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};
