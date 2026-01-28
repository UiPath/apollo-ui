import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    // For now only include canvas stories
    {
      directory: "../../../packages/apollo-react/src/canvas",
      files: "**/*.stories.@(tsx|ts|jsx|js|mdx)",
      titlePrefix: "Canvas",
    },
  ],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
