export const ContextIcon = ({ w = 24, h = 24 }: { w?: number | string; h?: number | string }) => {
  return (
    <svg width={w} height={h} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 12C7.10457 12 8 11.1046 8 10C8 8.89543 7.10457 8 6 8C4.89543 8 4 8.89543 4 10C4 11.1046 4.89543 12 6 12ZM6 13C7.65685 13 9 11.6569 9 10C9 8.34315 7.65685 7 6 7C4.34315 7 3 8.34315 3 10C3 11.6569 4.34315 13 6 13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.64645 13.6464L4.14645 11.1464L4.85355 11.8536L2.35355 14.3536C2.15829 14.5488 1.84171 14.5488 1.64645 14.3536C1.45118 14.1583 1.45118 13.8417 1.64645 13.6464Z"
        fill="currentColor"
      />
      <rect x="2" y="2" width="12" height="1" fill="currentColor" />
      <rect x="2" y="5" width="12" height="1" fill="currentColor" />
      <rect x="10" y="8" width="4" height="1" fill="currentColor" />
    </svg>
  );
};
