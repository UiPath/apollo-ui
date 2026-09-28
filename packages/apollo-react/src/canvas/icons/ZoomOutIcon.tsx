export const ZoomOutIcon = ({
  w = 32,
  h = 32,
  color = 'currentColor',
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13H5V11H19V13Z" fill={color} />
    </svg>
  );
};
