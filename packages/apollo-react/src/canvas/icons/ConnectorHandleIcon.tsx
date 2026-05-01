interface ConnectorHandleIconProps {
  w?: number | string;
  h?: number | string;
}

export const ConnectorHandleIcon = ({ w = 36, h = 24 }: ConnectorHandleIconProps = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: w, height: h, flexShrink: 0 }}
    viewBox="0 0 36 24"
    fill="none"
    role="img"
  >
    <circle cx="5" cy="12" r="2.25" fill="currentColor" />
    <path d="M7.5 12H31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M27.5 8L31 12L27.5 16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
