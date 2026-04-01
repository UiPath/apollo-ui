import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ReactFlowProvider, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { BASE_CANVAS_DEFAULTS } from '../../BaseCanvas/BaseCanvas.constants';
import type { BaseCanvasFitViewOptions } from '../../BaseCanvas/BaseCanvas.types';

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
   * When provided, Emotion styles will be injected into this container
   * instead of the document head via a scoped Emotion cache.
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
