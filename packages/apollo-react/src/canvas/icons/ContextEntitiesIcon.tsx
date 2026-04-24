export const ContextEntitiesIcon = ({
  w = 24,
  h = 24,
}: {
  w?: number | string;
  h?: number | string;
}) => {
  return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"
        fill="currentColor"
      />
    </svg>
  );
};
