export const ConversationalAgentIcon = ({
  w = 48,
  h = 48,
  color = 'var(--color-foreground-emp)',
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox="0 0 26 26"
      fill="none"
      data-testid="conversational-agent-icon"
    >
      <path
        d="M9.20901 13.541L11.7657 16.0977L10.4873 17.376L9.20901 16.0977L7.93068 17.376L6.65234 16.0977L9.20901 13.541ZM16.7923 13.541L19.349 16.0977L18.0707 17.376L16.7923 16.0977L15.514 17.376L14.2357 16.0977L16.7923 13.541Z"
        fill={color}
      />
      <path
        d="M5.25 8.58398H20.75C21.3023 8.58398 21.75 9.0317 21.75 9.58398V23.5293L16.874 21.9043C16.5683 21.8024 16.248 21.751 15.9258 21.751H5.25C4.69782 21.751 4.25018 21.3031 4.25 20.751V9.58398C4.25 9.0317 4.69772 8.58398 5.25 8.58398Z"
        stroke={color}
        strokeWidth="2"
      />
      <ellipse cx="12.9987" cy="4.33268" rx="2.16667" ry="2.16667" fill={color} />
      <rect x="11.918" y="5.41602" width="2.16667" height="2.16667" fill={color} />
      <path
        d="M1.08203 14C1.08203 13.4477 1.52975 13 2.08203 13H3.2487V18.4167H2.08203C1.52975 18.4167 1.08203 17.969 1.08203 17.4167V14Z"
        fill={color}
      />
      <rect x="3.25" y="15.166" width="2.16667" height="1.08333" fill={color} />
      <path
        d="M22.75 13H23.9167C24.4689 13 24.9167 13.4477 24.9167 14V17.4167C24.9167 17.969 24.469 18.4167 23.9167 18.4167H22.75V13Z"
        fill={color}
      />
      <rect x="20.582" y="15.166" width="2.16667" height="1.08333" fill={color} />
    </svg>
  );
};
