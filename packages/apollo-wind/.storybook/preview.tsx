import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/styles/globals.css";
import "../src/styles/theme.css";

const preview: Preview = {
  initialGlobals: {
    theme: "light",
    themeVariant: "uipath",
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
        ],
        dynamicTitle: true,
      },
    },
    themeVariant: {
      description: "Theme variant (color scheme)",
      toolbar: {
        title: "Variant",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default" },
          { value: "uipath", title: "UiPath" },
          { value: "vercel", title: "Vercel" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      const themeVariant = context.globals.themeVariant || "uipath";

      useEffect(() => {
        const htmlElement = document.documentElement;
        const body = document.body;

        // Remove existing theme class, add new one
        htmlElement.classList.remove("light", "dark");
        htmlElement.classList.add(theme);

        // Set data-theme attribute
        if (themeVariant === "default") {
          htmlElement.removeAttribute("data-theme");
        } else {
          htmlElement.setAttribute("data-theme", themeVariant);
        }

        // Apply background and text color to body for full coverage
        body.style.backgroundColor = "var(--color-background)";
        body.style.color = "var(--color-foreground)";
        body.style.minHeight = "100vh";
      }, [theme, themeVariant]);

      // Wrap all stories with themed background
      return (
        <div className={`bg-background text-foreground p-2`}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
