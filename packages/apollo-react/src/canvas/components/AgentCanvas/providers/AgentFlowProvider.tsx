import "@xyflow/react/dist/style.css";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { BASE_CANVAS_DEFAULTS } from "../../BaseCanvas/BaseCanvas.constants";

// Extract React Flow CSS from document stylesheets
const getReactFlowCSS = (): string => {
  const stylesheets = Array.from(document.styleSheets);
  let reactFlowCSS = "";

  for (const stylesheet of stylesheets) {
    try {
      if (stylesheet.cssRules) {
        const rules = Array.from(stylesheet.cssRules);
        const reactFlowRules = rules.filter((rule) => {
          if (rule instanceof CSSStyleRule) {
            return rule.selectorText && rule.selectorText.includes("react-flow");
          }
          return false;
        });

        if (reactFlowRules.length > 0) {
          reactFlowCSS += reactFlowRules.map((rule) => rule.cssText).join("\n");
        }
      }
    } catch {
      // CORS or other restrictions - skip this stylesheet
      continue;
    }
  }

  return reactFlowCSS;
};

// Utility to inject React Flow CSS into a specific container
const injectReactFlowStyles = (container: HTMLElement | ShadowRoot) => {
  // Check if styles are already injected
  const existingStyle = container.querySelector('style[data-reactflow-style="true"]');
  if (existingStyle) {
    return;
  }

  // Create style element with React Flow CSS
  const style = document.createElement("style");
  style.dataset.reactflowStyle = "true";
  style.textContent = getReactFlowCSS();

  // Insert at the beginning of the container
  if (container.firstChild) {
    container.insertBefore(style, container.firstChild);
  } else {
    container.append(style);
  }
};

// Utility to inject CSS variables into shadow DOM
const injectCSSVariables = (container: HTMLElement | ShadowRoot) => {
  // Check if CSS variables are already injected
  const existingVars = container.querySelector('style[data-css-variables="true"]');
  if (existingVars) {
    return;
  }

  // Get computed styles from the document root
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVariables: string[] = [];

  // Extract CSS variables that are likely needed
  const varPrefixes = ["--color", "--spacing", "--font", "--shadow", "--border"];

  for (const property of Array.from(rootStyles)) {
    if (varPrefixes.some((prefix) => property.startsWith(prefix))) {
      const value = rootStyles.getPropertyValue(property);
      if (value) {
        cssVariables.push(`${property}: ${value};`);
      }
    }
  }

  // Create style element with CSS variables
  const style = document.createElement("style");
  style.dataset.cssVariables = "true";
  style.textContent = `:host { ${cssVariables.join(" ")} }`;

  // Insert at the beginning of the container
  if (container.firstChild) {
    container.insertBefore(style, container.firstChild);
  } else {
    container.append(style);
  }
};

interface AgentFlowProviderContextType {
  resetViewport: () => void;
}

const AgentFlowProviderContext = createContext<AgentFlowProviderContextType | null>(null);

interface AgentVisualizationFlowProviderInnerProps extends PropsWithChildren {
  styleContainer?: HTMLElement | ShadowRoot;
}

const AgentVisualizationFlowProviderInner = ({ children, styleContainer }: AgentVisualizationFlowProviderInnerProps) => {
  const reactFlow = useReactFlow();

  // Create Emotion cache for shadow DOM if styleContainer is provided
  const emotionCache = useMemo(() => {
    if (styleContainer) {
      return createCache({
        key: "agent-flow-shadow",
        container: styleContainer,
        prepend: true, // Ensures styles are inserted before other content
      });
    }
    return undefined;
  }, [styleContainer]);

  // Inject styles into the provided container (for Shadow DOM support)
  useEffect(() => {
    if (styleContainer) {
      injectCSSVariables(styleContainer);
      injectReactFlowStyles(styleContainer);
    }
  }, [styleContainer]);

  const resetViewport = useCallback(() => {
    reactFlow.fitView(BASE_CANVAS_DEFAULTS.fitViewOptions);
  }, [reactFlow]);

  const value = useMemo(() => ({ resetViewport }), [resetViewport]);

  const content = <AgentFlowProviderContext.Provider value={value}>{children}</AgentFlowProviderContext.Provider>;

  // Conditionally wrap with CacheProvider for shadow DOM
  return emotionCache ? <CacheProvider value={emotionCache}>{content}</CacheProvider> : content;
};

interface AgentVisualizationFlowProviderProps extends PropsWithChildren {
  /**
   * Optional container for styles when using Shadow DOM.
   * When provided, all Emotion styles, CSS variables, and React Flow styles
   * will be injected into this container instead of the document head.
   * This enables the component to work correctly within Shadow DOM boundaries.
   */
  styleContainer?: HTMLElement | ShadowRoot;
}

export const AgentVisualizationFlowProvider = ({ styleContainer, ...props }: AgentVisualizationFlowProviderProps) => (
  <ReactFlowProvider>
    <AgentVisualizationFlowProviderInner styleContainer={styleContainer} {...props} />
  </ReactFlowProvider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAgentFlow = () => {
  const context = useContext(AgentFlowProviderContext);
  if (!context) {
    throw new Error("useAgentFlow must be used within an AgentFlowProvider");
  }
  return context;
};
