export const DataAndTools = ({ w = 48, h = 48 }: { w?: number | string; h?: number | string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 20 18" fill="none">
      <path
        d="M17.5 0H2.5C1.4 0 0.5 0.9 0.5 2V16C0.5 17.1 1.4 18 2.5 18H17.5C18.6 18 19.5 17.1 19.5 16V2C19.5 0.9 18.6 0 17.5 0ZM17.5 2V5H2.5V2H17.5ZM12.5 16H7.5V7H12.5V16ZM2.5 7H5.5V16H2.5V7ZM14.5 16V7H17.5V16H14.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
