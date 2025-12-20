import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/styles/tailwind.css";

const preview: Preview = {
  initialGlobals: {
    theme: "light",
    themeVariant: "default",
  },
  parameters: {
    options: {
      storySort: {
        order: [
          "Design Foundation",
          "Design System",
          [
            "All Components",
            "Core",
            "Data Display",
            "Layout",
            "Navigation",
            "Overlays",
            "Feedback",
          ],
          "Forms",
          "*",
          "Examples",
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
          { value: "light-hc", icon: "sun", title: "Light High Contrast" },
          { value: "dark-hc", icon: "moon", title: "Dark High Contrast" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";

      useEffect(() => {
        const htmlElement = document.documentElement;
        const body = document.body;

        // Remove existing theme class from both html and body
        htmlElement.classList.remove("light", "dark", "light-hc", "dark-hc");
        body.classList.remove("light", "dark", "light-hc", "dark-hc");

        // Add theme class to both (html for legacy, body for apollo-core)
        htmlElement.classList.add(theme);
        body.classList.add(theme);
        body.classList.add("bg-background", "text-foreground");
        body.style.minHeight = "100vh";
      }, [theme]);

      // Wrap all stories with themed background
      return (
        <div className="bg-background text-foreground p-1">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
