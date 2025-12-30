export const DataTransformIcon = ({
  w = 48,
  h = 48,
}: {
  w?: number | string;
  h?: number | string;
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 48 48" fill="none">
      <g style={{ mixBlendMode: 'darken' }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32.2353 7.80957V12.4354H20.4706V40.1905H15.7647V12.4354H4V7.80957H32.2353ZM39.2941 12.4354V19.3742H44V24H39.2941V35.5647H44V40.1905H39.2941C36.6951 40.1905 34.5882 38.1195 34.5882 35.5647V24H29.8824V19.3742H34.5882V12.4354H39.2941Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
