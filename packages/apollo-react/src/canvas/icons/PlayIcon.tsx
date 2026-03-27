export const PlayIcon = ({ w = 16, h = 16 }: { w?: number | string; h?: number | string }) => {
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
};
