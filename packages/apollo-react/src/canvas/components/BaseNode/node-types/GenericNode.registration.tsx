import type { NodeRegistration } from "../BaseNode.types";
import { ExecutionStatusIcon } from "../../ExecutionStatusIcon";

// TODO: convert this to a function, that takes a translate function to support localization

export const genericNodeRegistration: NodeRegistration = {
  nodeType: "generic",
  category: "actions",
  displayName: "Generic Node",
  description: "General purpose node for custom operations",
  icon: "widgets",
  tags: ["generic", "custom", "general", "utility"],
  sortOrder: 90,
  version: "1.0.0",

  definition: {
    getIcon: (_data, _context) => (
      <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M28.3333 28.3333V35H35V28.3333H28.3333ZM25 28.3333C25 26.4924 26.4924 25 28.3333 25H35C36.8409 25 38.3333 26.4924 38.3333 28.3333V35C38.3333 36.8409 36.8409 38.3333 35 38.3333H28.3333C26.4924 38.3333 25 36.8409 25 35V28.3333Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.99996 28.3333V35H11.6666V28.3333H4.99996ZM1.66663 28.3333C1.66663 26.4924 3.15901 25 4.99996 25H11.6666C13.5076 25 15 26.4924 15 28.3333V35C15 36.8409 13.5076 38.3333 11.6666 38.3333H4.99996C3.15901 38.3333 1.66663 36.8409 1.66663 35V28.3333Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.6667 4.99996V11.6666H23.3334V4.99996H16.6667ZM13.3334 4.99996C13.3334 3.15901 14.8258 1.66663 16.6667 1.66663H23.3334C25.1743 1.66663 26.6667 3.15901 26.6667 4.99996V11.6666C26.6667 13.5076 25.1743 15 23.3334 15H16.6667C14.8258 15 13.3334 13.5076 13.3334 11.6666V4.99996Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.64294 19.3097C8.26806 18.6846 9.1159 18.3334 9.99996 18.3334H30C30.884 18.3334 31.7319 18.6846 32.357 19.3097C32.9821 19.9348 33.3333 20.7827 33.3333 21.6667V26.6667C33.3333 27.5872 32.5871 28.3334 31.6666 28.3334C30.7461 28.3334 30 27.5872 30 26.6667L30 21.6667H9.99996L9.99996 26.6667C9.99996 27.5872 9.25377 28.3334 8.33329 28.3334C7.41282 28.3334 6.66663 27.5872 6.66663 26.6667V21.6667C6.66663 20.7827 7.01782 19.9348 7.64294 19.3097Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20 11.6666C20.9205 11.6666 21.6667 12.4128 21.6667 13.3333V20C21.6667 20.9204 20.9205 21.6666 20 21.6666C19.0796 21.6666 18.3334 20.9204 18.3334 20V13.3333C18.3334 12.4128 19.0796 11.6666 20 11.6666Z"
          fill="currentColor"
        />
      </svg>
    ),

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: data.display?.shape ?? ("square" as const),
      background: data.display?.background,
      iconBackground: data.display?.iconBackground,
      iconColor: data.display?.iconColor,
    }),

    getAdornments: (_data, context) => {
      const executionState = context.executionState;
      const status = typeof executionState === "string" ? executionState : executionState?.status;

      return {
        topRight: <ExecutionStatusIcon status={status} />,
      };
    },

    getMenuItems: (_data, _context) => [],

    getDefaultParameters: () => ({}),
  },
};
