import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ReactFlowProvider, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { BASE_CANVAS_DEFAULTS } from '../../BaseCanvas/BaseCanvas.constants';
import type { BaseCanvasFitViewOptions } from '../../BaseCanvas/BaseCanvas.types';

// Extract React Flow CSS from document stylesheets
const getReactFlowCSS = (): string => {
  const stylesheets = Array.from(document.styleSheets);
  let reactFlowCSS = '';

  for (const stylesheet of stylesheets) {
    try {
      if (stylesheet.cssRules) {
        const rules = Array.from(stylesheet.cssRules);
        const reactFlowRules = rules.filter((rule) => {
          if (rule instanceof CSSStyleRule) {
            return rule.selectorText && rule.selectorText.includes('react-flow');
          }
          return false;
        });

        if (reactFlowRules.length > 0) {
          reactFlowCSS += reactFlowRules.map((rule) => rule.cssText).join('\n');
        }
      }
    } catch {}
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
  const style = document.createElement('style');
  style.dataset.reactflowStyle = 'true';
  style.textContent = getReactFlowCSS();

  // Insert at the beginning of the container
  if (container.firstChild) {
    container.insertBefore(style, container.firstChild);
  } else {
    container.append(style);
  }
};

// Extract UIX Canvas CSS variable declarations from document stylesheets
// and remap them to :host so they resolve inside Shadow DOM
const getUixCanvasCSS = (): string => {
  const stylesheets = Array.from(document.styleSheets);
  const declarations: string[] = [];

  for (const stylesheet of stylesheets) {
    try {
      if (stylesheet.cssRules) {
        for (const rule of Array.from(stylesheet.cssRules)) {
          if (rule instanceof CSSStyleRule && rule.cssText.includes('--uix-canvas-')) {
            // Extract just the declaration block from the rule
            const match = rule.cssText.match(/\{([^}]+)\}/);
            if (match?.[1]) {
              declarations.push(match[1].trim());
            }
          }
        }
      }
    } catch {}
  }

  return declarations.length > 0 ? `:host { ${declarations.join(' ')} }` : '';
};

// Utility to inject CSS variables into shadow DOM
const injectCSSVariables = (container: HTMLElement | ShadowRoot) => {
  // Check if CSS variables are already injected
  const existingVars = container.querySelector('style[data-css-variables="true"]');
  if (existingVars) {
    return;
  }

  // Get computed styles from document body (where theme classes and canvas variables are defined)
  const rootStyles = getComputedStyle(document.body);
  const cssVariables: string[] = [];

  // Extract CSS variables that are likely needed
  const varPrefixes = ['--color', '--spacing', '--font', '--shadow', '--border'];

  for (const property of Array.from(rootStyles)) {
    if (varPrefixes.some((prefix) => property.startsWith(prefix))) {
      const value = rootStyles.getPropertyValue(property);
      if (value) {
        cssVariables.push(`${property}: ${value};`);
      }
    }
  }

  // Also extract canvas variable declarations from stylesheets,
  // preserving var() references so they resolve via inheritance
  const canvasCSS = getUixCanvasCSS();

  // Create style element with CSS variables
  const style = document.createElement('style');
  style.dataset.cssVariables = 'true';
  style.textContent = `:host { ${cssVariables.join(' ')} }\n${canvasCSS}`;

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
  fitViewOptions?: BaseCanvasFitViewOptions;
}

const AgentVisualizationFlowProviderInner = ({
  children,
  styleContainer,
  fitViewOptions,
}: AgentVisualizationFlowProviderInnerProps) => {
  const reactFlow = useReactFlow();

  // Create Emotion cache for shadow DOM if styleContainer is provided
  const emotionCache = useMemo(() => {
    if (styleContainer) {
      return createCache({
        key: 'agent-flow-shadow',
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
    reactFlow.fitView(fitViewOptions ?? BASE_CANVAS_DEFAULTS.fitViewOptions);
  }, [reactFlow, fitViewOptions]);

  const value = useMemo(() => ({ resetViewport }), [resetViewport]);

  const content = (
    <AgentFlowProviderContext.Provider value={value}>{children}</AgentFlowProviderContext.Provider>
  );

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
  fitViewOptions?: BaseCanvasFitViewOptions;
}

export const AgentVisualizationFlowProvider = ({
  styleContainer,
  fitViewOptions,
  ...props
}: AgentVisualizationFlowProviderProps) => (
  <ReactFlowProvider>
    <AgentVisualizationFlowProviderInner
      styleContainer={styleContainer}
      fitViewOptions={fitViewOptions}
      {...props}
    />
  </ReactFlowProvider>
);

export const useAgentFlow = () => {
  const context = useContext(AgentFlowProviderContext);
  if (!context) {
    throw new Error('useAgentFlow must be used within an AgentFlowProvider');
  }
  return context;
};
