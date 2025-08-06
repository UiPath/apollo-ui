type ItemWithClassName<T> = T & { className?: string };

export const addAnimationClasses = <T extends ItemWithClassName<unknown>>(items: T[]): T[] => {
  return items.map((item) => ({ ...item, className: "animating" }));
};

export const removeAnimationClasses = <T extends ItemWithClassName<unknown>>(items: T[]): T[] => {
  return items.map((item) => ({ ...item, className: undefined }));
};
