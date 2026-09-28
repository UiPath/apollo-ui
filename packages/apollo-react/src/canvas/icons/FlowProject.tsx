export const FlowProject = ({ w = 22, h = 22 }: { w?: number | string; h?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="flow-project"
    width={w}
    height={h}
    fill="none"
    viewBox="0 0 32 32"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m12.667 20 2 2m-2 2 2-2h-3.334A1.333 1.333 0 0 1 10 20.667v-1.334m11.333.001H18a.667.667 0 0 0-.667.666v3.334c0 .368.299.666.667.666h3.333a.667.667 0 0 0 .667-.666V20a.667.667 0 0 0-.667-.666M14 12h-3.333a.667.667 0 0 0-.667.667V16c0 .368.299.667.667.667H14a.667.667 0 0 0 .667-.667v-3.333A.667.667 0 0 0 14 12"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.182 7.636 6.148 3.06a2.55 2.55 0 0 1 1.923-.878H23.93c.738 0 1.44.32 1.923.878l3.966 4.576v19.637a2.546 2.546 0 0 1-2.545 2.545H4.727a2.546 2.546 0 0 1-2.545-2.545zm5.89-3.272h15.857c.105 0 .205.045.274.125l1.782 2.056H6.015L7.796 4.49a.36.36 0 0 1 .274-.125m19.564 4.363H4.364v18.546c0 .2.162.363.363.363h22.546c.2 0 .363-.162.363-.363z"
    />
  </svg>
);
