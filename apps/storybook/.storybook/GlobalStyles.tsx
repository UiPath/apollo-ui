import { useEffect } from "react";

/**
 * Global CSS reset and base styles for Storybook
 */
export const GlobalStyles = () => {
  useEffect(() => {
    // Apply styles to document
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      /* Modern CSS Reset */

      /*
        1. Use a more-intuitive box-sizing model
      */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /*
        2. Remove default margin and padding
      */
      * {
        margin: 0;
        padding: 0;
      }

      /*
        3. Allow percentage-based heights in the application
      */
      html,
      body {
        height: 100%;
      }

      /*
        4. Improve text rendering
      */
      body {
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        font-family: system-ui, sans-serif;
        background-color: #fff;
        color: #000;
      }

      /*
        5. Improve media defaults
      */
      img,
      picture,
      video,
      canvas {
        display: block;
        max-width: 100%;
      }

      /*
        6. Remove built-in form typography styles
      */
      input,
      button,
      textarea,
      select {
        font: inherit;
      }

      /*
        7. Avoid text overflows
      */
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        overflow-wrap: break-word;
      }

      /*
        8. Create a root stacking context
      */
      #root,
      #__next {
        isolation: isolate;
      }

      /*
        9. Remove list styles
      */
      ul,
      ol {
        list-style: none;
      }

      /*
        10. Reset anchor styles
      */
      a {
        text-decoration: none;
        color: inherit;
      }

      /*
        11. Cursor on interactive elements
      */
      button,
      [role="button"] {
        cursor: pointer;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};
