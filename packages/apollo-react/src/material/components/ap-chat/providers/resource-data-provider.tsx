import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AutopilotChatResourceItem,
  AutopilotChatResourceItemSelector,
  AutopilotChatResourceManager,
  AutopilotChatResourceResult,
  AutopilotChatResourceSearchPayload,
} from '../service';
import { AutopilotChatEvent } from '../service';
import { useChatService } from './chat-service.provider';

const EMPTY_RESULT: AutopilotChatResourceResult = { items: [], done: true };

interface ResourceDataContextType
  extends Required<
    Pick<AutopilotChatResourceManager, 'getNestedResources' | 'globalSearch' | 'onResourceSelected'>
  > {
  topLevelResources: AutopilotChatResourceItemSelector[];
  hasResources: boolean;
  paginatedResources: boolean;
}

const ResourceDataContext = createContext<ResourceDataContextType>({
  topLevelResources: [],
  hasResources: false,
  paginatedResources: false,
  getNestedResources: async () => EMPTY_RESULT,
  globalSearch: async () => EMPTY_RESULT,
  onResourceSelected: () => {},
});

export function AutopilotResourceDataProvider({ children }: { children: React.ReactNode }) {
  const chatService = useChatService();

  const [resourceManager, setResourceManager] = useState<
    AutopilotChatResourceManager | undefined
  >();
  const [topLevelResources, setTopLevelResources] = useState<AutopilotChatResourceItemSelector[]>(
    []
  );

  const paginatedResources = chatService?.getConfig?.()?.paginatedResources ?? false;

  useEffect(() => {
    if (!chatService) return;

    const unsubscribeResourceManager = chatService.on(
      AutopilotChatEvent.SetResourceManager,
      (manager: AutopilotChatResourceManager) => {
        setResourceManager(manager);
        setTopLevelResources(manager?.getTopLevelResources() ?? []);
      }
    );

    const existingManager = chatService.getResourceManager?.();
    if (existingManager) {
      setResourceManager(existingManager);
      setTopLevelResources(existingManager.getTopLevelResources());
    }

    return () => unsubscribeResourceManager();
  }, [chatService]);

  const hasResources = topLevelResources.length > 0;

  const getNestedResources = useCallback(
    async (
      resourceId: string,
      options?: AutopilotChatResourceSearchPayload
    ): Promise<AutopilotChatResourceResult> => {
      if (!resourceManager) return EMPTY_RESULT;
      return resourceManager.getNestedResources(resourceId, options);
    },
    [resourceManager]
  );

  const globalSearch = useCallback(
    async (options: AutopilotChatResourceSearchPayload): Promise<AutopilotChatResourceResult> => {
      if (!resourceManager) return EMPTY_RESULT;
      return resourceManager.globalSearch(options);
    },
    [resourceManager]
  );

  const onResourceSelected = useCallback(
    (item: AutopilotChatResourceItem) => {
      resourceManager?.onResourceSelected?.(item);
    },
    [resourceManager]
  );

  return (
    <ResourceDataContext.Provider
      value={{
        topLevelResources,
        hasResources,
        paginatedResources,
        getNestedResources,
        globalSearch,
        onResourceSelected,
      }}
    >
      {children}
    </ResourceDataContext.Provider>
  );
}

export const useResourceData = () => useContext(ResourceDataContext);
