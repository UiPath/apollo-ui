import type {
    AutopilotChatAllowedAttachments,
    AutopilotChatConfiguration,
    AutopilotChatDisabledFeatures,
    AutopilotChatEventHandler,
    AutopilotChatEventInterceptor,
    AutopilotChatHistory,
    AutopilotChatMessage,
    AutopilotChatMessageRenderer,
    AutopilotChatModelInfo,
    AutopilotChatOverrideLabels,
    AutopilotChatPreHookAction,
    AutopilotChatPrompt,
    AutopilotChatSuggestion,
} from '../types/AutopilotChatModel';
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
    AutopilotChatRole,
} from '../types/AutopilotChatModel';
import {
    ACCEPTED_FILE_MAX_COUNT,
    ACCEPTED_FILE_MAX_SIZE,
    ACCEPTED_FILES,
    CHAT_INSTANCE_DEFAULT_NAME,
    DEFAULT_MESSAGE_RENDERER,
    getChatModeKey,
} from './ChatConstants';
import { AutopilotChatInternalService } from './ChatInternalService';
import { EventBus } from './EventBus';
import { LocalHistoryService } from './LocalHistory';
import { StorageService } from './StorageService';

export class AutopilotChatService {
    private static _instances: Record<string, AutopilotChatService> = {};
    private _initialConfig: AutopilotChatConfiguration = {
        mode: StorageService.Instance.get(getChatModeKey()) as AutopilotChatMode
            ?? AutopilotChatMode.Closed,
        allowedAttachments: {
            multiple: true,
            types: ACCEPTED_FILES,
            maxSize: ACCEPTED_FILE_MAX_SIZE,
            maxCount: ACCEPTED_FILE_MAX_COUNT,
        },
        // Settings will be disabled by default since each consumer needs to implement their own settings page
        // Or the framework will provide a settings page that will be used by all framework consumers
        disabledFeatures: { settings: true },
        settingsRenderer: () => {},
        models: undefined,
        selectedModel: undefined,
        paginatedMessages: false,
    };
    private _config: AutopilotChatConfiguration = { ...this._initialConfig };
    private _eventBus: EventBus;
    private _messageRenderers: AutopilotChatMessageRenderer[] = [];
    private _eventUnsubscribers: Array<() => void> = [];
    private _conversation: AutopilotChatMessage[] = [];
    private _error: string | undefined;
    private _prompt: AutopilotChatPrompt | string | undefined;
    private _history: AutopilotChatHistory[] = [];
    private _historyOpen: boolean = false;
    private _settingsOpen: boolean = false;
    private _activeConversationId: string | null = null;
    private _defaultLoadingMessages: string[] | null = null;
    private _loadingMessage: string | null = null;
    private _loadingMessageDuration: number | null = null;
    private _internalService: AutopilotChatInternalService;
    private _groupId?: string;
    private _instanceName: string;

    private constructor(instanceName: string) {
        this._instanceName = instanceName;
        this._eventBus = new EventBus();

        this._internalService = AutopilotChatInternalService.Instantiate();
        LocalHistoryService.Initialize(instanceName, this);

        this.getConfig = this.getConfig.bind(this);
        this.initialize = this.initialize.bind(this);
        this.on = this.on.bind(this);
        this.open = this.open.bind(this);
        this.injectMessageRenderer = this.injectMessageRenderer.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.close = this.close.bind(this);
        this.setError = this.setError.bind(this);
        this.clearError = this.clearError.bind(this);
        this.newChat = this.newChat.bind(this);
        this.setChatMode = this.setChatMode.bind(this);
        this.sendRequest = this.sendRequest.bind(this);
        this.sendResponse = this.sendResponse.bind(this);
        this.setDefaultLoadingMessages = this.setDefaultLoadingMessages.bind(this);
        this.getDefaultLoadingMessages = this.getDefaultLoadingMessages.bind(this);
        this.getLoadingMessageDuration = this.getLoadingMessageDuration.bind(this);
        this.setLoadingMessage = this.setLoadingMessage.bind(this);
        this.getLoadingMessage = this.getLoadingMessage.bind(this);
        this.setPrompt = this.setPrompt.bind(this);
        this.intercept = this.intercept.bind(this);
        this.setFirstRunExperience = this.setFirstRunExperience.bind(this);
        this.setConversation = this.setConversation.bind(this);
        this.getConversation = this.getConversation.bind(this);
        this.getPrompt = this.getPrompt.bind(this);
        this.getError = this.getError.bind(this);
        this.setHistory = this.setHistory.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.toggleHistory = this.toggleHistory.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.deleteConversation = this.deleteConversation.bind(this);
        this.openConversation = this.openConversation.bind(this);
        this.setAllowedAttachments = this.setAllowedAttachments.bind(this);
        this.toggleAutoScroll = this.toggleAutoScroll.bind(this);
        this.setModels = this.setModels.bind(this);
        this.setSelectedModel = this.setSelectedModel.bind(this);
        this.getSelectedModel = this.getSelectedModel.bind(this);
        this.getMessagesInGroup = this.getMessagesInGroup.bind(this);
        this.setPreHook = this.setPreHook.bind(this);
        this.getPreHook = this.getPreHook.bind(this);
        this.prependOlderMessages = this.prependOlderMessages.bind(this);
        this.setSuggestions = this.setSuggestions.bind(this);
    }

    static Instantiate({
        instanceName = CHAT_INSTANCE_DEFAULT_NAME,
        config,
        messageRenderers = [],
    }: {
        instanceName?: string;
        config?: AutopilotChatConfiguration;
        messageRenderers?: AutopilotChatMessageRenderer[];
    }) {
        if (!AutopilotChatService._instances[instanceName]) {
            AutopilotChatService._instances[instanceName] = new AutopilotChatService(instanceName);
        }

        if (config) {
            AutopilotChatService._instances[instanceName].initialize(config);
        }

        messageRenderers.forEach(renderer => AutopilotChatService._instances[instanceName].injectMessageRenderer(renderer));

        return AutopilotChatService._instances[instanceName];
    }

    static getInstance(instanceName: string = CHAT_INSTANCE_DEFAULT_NAME) {
        return AutopilotChatService._instances[instanceName];
    }

    /**
     * @returns The current active conversation ID
     */
    get activeConversationId() {
        return this._activeConversationId;
    }

    /**
     * @returns The current configuration
     */
    getConfig() {
        return this._config;
    }

    /**
     * Initializes the chat service
     *
     * @param config - The configuration to use
     */
    initialize(config: AutopilotChatConfiguration, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        // Cleanup existing handlers
        this._eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this._eventUnsubscribers = [];

        this._config = {
            ...this._initialConfig,
            ...config,
        };

        if (config.mode) {
            this.setChatMode(config.mode);
        }

        if (config.disabledFeatures) {
            this.setDisabledFeatures(config.disabledFeatures);
        }

        if (config.overrideLabels) {
            this.setOverrideLabels(config.overrideLabels);
        }

        if (config.firstRunExperience) {
            this.setFirstRunExperience(config.firstRunExperience);
        }

        if (config.useLocalHistory !== undefined) {
            this._internalService.publish(AutopilotChatInternalEvent.UseLocalHistory, config.useLocalHistory);
        }

        if (config.allowedAttachments) {
            this.setAllowedAttachments({
                ...this._config.allowedAttachments,
                ...config.allowedAttachments,
            });
        }

        if (config.models) {
            this.setModels(config.models);
        }

        if (config.selectedModel) {
            this.setSelectedModel(config.selectedModel.id);
        }

        messageRenderers.forEach(renderer => this.injectMessageRenderer(renderer));
    }

    /**
     * Patches the configuration in the chat service
     *
     * @param config - The configuration to patch
     */
    patchConfig(config: Partial<AutopilotChatConfiguration>, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        this._config = {
            ...this._config,
            ...config,
        };

        this.initialize(this._config, messageRenderers);
    }

    /**
     * Injects a message renderer into the chat service, overrides existing message renderer if it exists
     *
     * @param renderer - The message renderer to inject
     */
    injectMessageRenderer(renderer: AutopilotChatMessageRenderer) {
        const existingRenderer = this._messageRenderers.find(r => r.name === renderer.name);

        if (existingRenderer) {
            const index = this._messageRenderers.indexOf(existingRenderer);
            this._messageRenderers[index] = renderer;
        } else {
            this._messageRenderers.push(renderer);
        }
    }

    /**
     * Gets a message renderer by name and defaults to the default renderer if not found
     *
     * @param name - The name of the message renderer to get
     * @returns The message renderer
     */
    getMessageRenderer(name: string) {
        return this._messageRenderers.find(r => r.name === name);
    }

    /**
     * Renders a message renderer into the container.
     * If the message renderer is not found, it will use the default renderer.
     *
     * @param name - The name of the message renderer to render based on the message renderer
     * @param container - The container to render the message renderer into
     * @param message - The message to render the message renderer for
     * @internal
     */
    renderMessage(container: HTMLElement, message: AutopilotChatMessage) {
        const renderer = this._messageRenderers.find(r => r.name === message.widget);

        if (!renderer) {
            if ((globalThis as any)['__StencilReactAdapter_EnableDebugging']) {
                // eslint-disable-next-line no-console
                console.warn(`AutopilotChatService: Message renderer with name ${name} not found, using markdown renderer`);
            }
        }

        if (!renderer?.render) {
            return;
        }

        return renderer.render(container, message);
    }

    /**
     * Opens the chat service
     *
     * @param config - The configuration to use
     * @param messageRenderers - The custom message renderers to inject
     */
    open(config?: Partial<AutopilotChatConfiguration>, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        if (this._config.embeddedContainer) {
            this._config.embeddedContainer.innerHTML = '';
            this._config.embeddedContainer = undefined;
        }

        if (config?.mode === AutopilotChatMode.Embedded && config?.embeddedContainer) {
            const chatElement = document.createElement('ap-autopilot-chat');
            (chatElement as any).chatServiceInstance = this;

            config.embeddedContainer.innerHTML = '';
            config.embeddedContainer.appendChild(chatElement);
        }

        this.patchConfig(
            {
                mode: AutopilotChatMode.SideBySide,
                ...(config ?? {}),
            },
            messageRenderers,
        );

        this._eventBus.publish(AutopilotChatEvent.Open);
    }

    /**
     * Closes the chat service
     */
    close() {
        this.setChatMode(AutopilotChatMode.Closed);

        this._eventBus.publish(AutopilotChatEvent.Close);
    }

    /**
     * Expands the chat window
     */
    setChatMode(mode: AutopilotChatMode) {
        const key = getChatModeKey(this._instanceName);
        const storedMode = StorageService.Instance.get(key);

        if (storedMode && mode === AutopilotChatMode.Closed) {
            StorageService.Instance.remove(key);
        }

        if (mode !== AutopilotChatMode.Closed) {
            StorageService.Instance.set(key, mode);
        }

        this._config.mode = mode;

        this._eventBus.publish(AutopilotChatEvent.ModeChange, mode);
    }

    /**
     * Sets the enabled features in the chat service
     *
     * @param features - The features to set
     */
    setDisabledFeatures(features: AutopilotChatDisabledFeatures) {
        this._config.disabledFeatures = {
            ...this._config.disabledFeatures,
            ...features,
        };

        this._eventBus.publish(AutopilotChatEvent.SetDisabledFeatures, this._config.disabledFeatures);
    }

    /**
     * Sets the override labels in the chat service
     *
     * @param labels - The override labels to set
     */
    setOverrideLabels(labels: AutopilotChatOverrideLabels) {
        this._config.overrideLabels = {
            ...this._config.overrideLabels,
            ...labels,
        };

        this._eventBus.publish(AutopilotChatEvent.SetOverrideLabels, this._config.overrideLabels);
    }

    /**
     * Sets the first run configuration in the chat service
     *
     * @param config - The configuration to set
     */
    setFirstRunExperience(config: AutopilotChatConfiguration['firstRunExperience']) {
        this._config.firstRunExperience = config;

        this._eventBus.publish(AutopilotChatEvent.SetFirstRunExperience, config);
    }

    /**
     * Sets a prompt in the chat service
     *
     * @param prompt - The prompt to set
     */
    setPrompt(prompt: AutopilotChatPrompt | string) {
        this._prompt = prompt;

        this._eventBus.publish(AutopilotChatEvent.SetPrompt, prompt);
    }

    /**
     * Gets the current prompt from the chat service
     *
     * @returns The prompt
     */
    getPrompt() {
        return this._prompt;
    }

    /**
     * Sets the suggestions in the chat service
     *
     * @param suggestions - The suggestions to set
     * @param sendOnClick - Whether to send the suggestion on click
     */
    setSuggestions(suggestions: AutopilotChatSuggestion[], sendOnClick?: boolean) {
        this._internalService.publish(AutopilotChatInternalEvent.SetSuggestions, {
            suggestions,
            sendOnClick,
        });
    }

    /**
     * Sets a conversation in the chat service
     *
     * @param messages - The messages to set
     */
    setConversation(messages: AutopilotChatMessage[]) {
        this._conversation = messages;

        this._internalService.publish(AutopilotChatInternalEvent.ShowLoadingState, false);
        this._internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreMessages, false);
        this._eventBus.publish(AutopilotChatEvent.SetConversation, messages);
    }

    /**
     * Prepends older messages to the conversation when scrolling up and reaching the top
     * This is called by the consumer in response to the ConversationLoadMore event
     *
     * @param messages - The older messages to prepend
     * @param done - Whether the messages are the last set of messages
     */
    prependOlderMessages(messages: AutopilotChatMessage[] = [], done?: boolean) {
        if (done) {
            // wait for the next frame to ensure the conversation is updated
            requestAnimationFrame(() => {
                this._internalService.publish(AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages, false);
            });
        }

        if (messages.length === 0) {
            return;
        }

        // Emit internal event to signal that messages are being prepended in order to maintain scroll position
        this._internalService.publish(AutopilotChatInternalEvent.PrependOlderMessages);

        this.setConversation([ ...messages, ...this._conversation ]);
    }

    /**
     * Gets the current conversation from the chat service
     *
     * @returns The conversation
     */
    getConversation() {
        return this._conversation;
    }

    /**
     * Sends a request as an user request to the chat service
     *
     * @param request - The request to send
     */
    sendRequest(request: Omit<AutopilotChatMessage, 'role' | 'id' | 'created_at' | 'widget' | 'fakeStream'> & {
        id?: string;
        created_at?: string;
    }) {
        this._groupId = crypto.randomUUID();

        const userMessage = {
            id: crypto.randomUUID(), // Generate a new ID in case it's not provided
            created_at: new Date().toISOString(),
            ...request,
            role: AutopilotChatRole.User,
            widget: DEFAULT_MESSAGE_RENDERER,
        };

        this.setPrompt('');
        this.setSuggestions([]);
        this._conversation.push(userMessage);
        this._eventBus.publish(AutopilotChatEvent.Request, userMessage);
    }

    /**
     * Stops the response in the chat service
     */
    stopResponse() {
        const lastMessage = this._conversation[this._conversation.length - 1];

        if (lastMessage?.stream && !lastMessage.done) {
            this.sendResponse({
                ...lastMessage,
                done: true,
                content: '',
            });
        }

        this._eventBus.publish(AutopilotChatEvent.StopResponse);
    }

    /**
     * Sends a response as an AI assistant response to the chat service
     *
     * @param response - The response to send
     */
    sendResponse(response: Omit<AutopilotChatMessage, 'role' | 'id'> & { id?: string }) {
        const lastMessage = this._conversation[this._conversation.length - 1];

        // Set the last message groupId as the groupId for the response if it's an assistant message
        if (lastMessage?.groupId && lastMessage.role === AutopilotChatRole.Assistant && this._groupId !== lastMessage.groupId) {
            this._groupId = lastMessage.groupId;
        }

        const assistantMessage = {
            id: crypto.randomUUID(),
            ...response,
            groupId: response.groupId ?? this._groupId,
            created_at: response.created_at ?? new Date().toISOString(),
            role: AutopilotChatRole.Assistant,
        };

        // Check if message with the same ID already exists and emit chunk, otherwise emit response
        const existingIndex = this._conversation.findIndex(message => message.id === assistantMessage.id);

        if (existingIndex !== -1) {
            if (response.stream) {
                // send chunk if the response is streaming
                this._conversation[existingIndex].content += assistantMessage.content;
                this._conversation[existingIndex].done = !!response.done;
                this._conversation[existingIndex].meta = response.meta ?? this._conversation[existingIndex].meta;
                this._conversation[existingIndex].groupId = assistantMessage.groupId ?? this._conversation[existingIndex].groupId;
                this._eventBus.publish(AutopilotChatEvent.SendChunk, assistantMessage);
            } else {
                // send response if the response is not streaming
                this._conversation[existingIndex] = {
                    ...this._conversation[existingIndex],
                    ...assistantMessage,
                };
                this._eventBus.publish(AutopilotChatEvent.Response, assistantMessage);
            }
        } else {
            this._conversation.push(assistantMessage);
            this._eventBus.publish(AutopilotChatEvent.Response, assistantMessage);
        }
    }

    /**
     * Sets the loading message in the chat service
     *
     * @param messages - The messages to show in the loading state
     * @param duration - The duration in milliseconds to show each message (optional)
     */
    setDefaultLoadingMessages(messages: string[], duration?: number) {
        this._defaultLoadingMessages = messages;
        if (duration) {
            this._loadingMessageDuration = duration;
        }

        this._eventBus.publish(AutopilotChatEvent.SetDefaultLoadingMessages, {
            messages,
            duration,
        });
    }

    /**
     * Gets the default loading messages in the chat service
     *
     * @returns The default loading messages
     */
    getDefaultLoadingMessages() {
        return this._defaultLoadingMessages;
    }

    /**
     * Gets the current loading message duration
     *
     * @returns The loading message duration in milliseconds
     */
    getLoadingMessageDuration() {
        return this._loadingMessageDuration;
    }

    /**
     * Sets a single loading message in the chat service
     *
     * @param message - The message to show in the loading state
     */
    setLoadingMessage(message: string) {
        this._loadingMessage = message;

        this._eventBus.publish(AutopilotChatEvent.SetLoadingMessage, message);
    }

    /**
     * Gets the current loading message
     *
     * @returns The loading message
     */
    getLoadingMessage() {
        return this._loadingMessage;
    }

    /**
     * Creates a new chat
     *
     * @param config - The configuration to use
     * @param messageRenderers - The custom message renderers to inject
     */
    newChat(config?: AutopilotChatConfiguration) {
        if (config) {
            this.patchConfig(config);
        }

        this._groupId = undefined;
        this._conversation = [];
        this._eventBus.publish(AutopilotChatEvent.NewChat);
        this._internalService.publish(AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages, true);
        this._internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreMessages, false);
    }

    /**
     * Sets an error in the chat service
     *
     * @param error - The error to set
     */
    setError(error: string) {
        this._error = error;

        this._eventBus.publish(AutopilotChatEvent.Error, error);
    }

    /**
     * Clears the error in the chat service
     */
    clearError() {
        this._error = undefined;

        this._eventBus.publish(AutopilotChatEvent.Error, undefined);
    }

    /**
     * Gets the current error from the chat service
     *
     * @returns The error
     */
    getError() {
        return this._error;
    }

    /**
     * Subscribes to an event
     *
     * @param event - The event to subscribe to
     * @param handler - The handler to subscribe to the event
     * @returns A function to unsubscribe from the event
     */
    on(event: AutopilotChatEvent, handler: AutopilotChatEventHandler) {
        return this._eventBus.subscribe(event, handler);
    }

    /**
     * Adds an interceptor to the event bus
     *
     * @param event - The event to intercept
     * @param interceptor - The interceptor to add
     * @returns A function to remove the interceptor
     */
    intercept(event: AutopilotChatInterceptableEvent, interceptor: AutopilotChatEventInterceptor) {
        if (Object.values(AutopilotChatInterceptableEvent).includes(event)) {
            return this._eventBus.intercept(event, interceptor);
        }

        return () => {};
    }

    /**
     * Sets the history in the chat service
     *
     * @param history - The history to set
     */
    setHistory(history: AutopilotChatHistory[]) {
        this._history = history;

        this._eventBus.publish(AutopilotChatEvent.SetHistory, history);
    }

    /**
     * Gets the history from the chat service
     *
     * @returns The history
     */
    getHistory() {
        return this._history;
    }

    /**
     * Gets the history open state from the chat service
     *
     * @returns The history open state
     */
    get historyOpen() {
        return this._historyOpen;
    }

    /**
     * Gets the settings open state from the chat service
     *
     * @returns The settings open state
     */
    get settingsOpen() {
        return this._settingsOpen;
    }

    /**
     * Toggles the history in the chat service
     *
     * @param open - The open state to set (optional, defaults to toggle)
     */
    toggleHistory(open?: boolean) {
        this._historyOpen = open ?? !this._historyOpen;

        // close settings if history is open
        if (this._historyOpen) {
            this._settingsOpen = false;
            this._internalService.publish(AutopilotChatInternalEvent.ToggleSettings, false);
        }

        this._internalService.publish(AutopilotChatInternalEvent.ToggleHistory, this._historyOpen);
    }

    /**
     * Toggles the settings in the chat service
     *
     * @param open - The open state to set (optional, defaults to toggle)
     */
    toggleSettings(open?: boolean) {
        this._settingsOpen = open ?? !this._settingsOpen;

        // close history if settings is open
        if (this._settingsOpen) {
            this._historyOpen = false;
            this._internalService.publish(AutopilotChatInternalEvent.ToggleHistory, false);
        }

        this._internalService.publish(AutopilotChatInternalEvent.ToggleSettings, this._settingsOpen);
    }

    /**
     * Deletes a conversation from the chat service
     *
     * @param conversationId - The conversation ID to delete
     */
    deleteConversation(conversationId: string) {
        if (conversationId === this._activeConversationId) {
            this._activeConversationId = null;
            this._groupId = undefined;
        }

        this._eventBus.publish(AutopilotChatEvent.DeleteConversation, conversationId);
    }

    /**
     * Opens a conversation from the chat service
     *
     * @param conversationId - The conversation ID to open
     */
    openConversation(conversationId: string | null, showLoadingState = true) {
        this._activeConversationId = conversationId;
        this._eventBus.publish(AutopilotChatEvent.OpenConversation, conversationId);
        this._internalService.publish(AutopilotChatInternalEvent.ShowLoadingState, showLoadingState);
        this._internalService.publish(AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages, true);
    }

    /**
     * Sets the allowed attachments in the chat service
     *
     * @param allowedAttachments - The allowed attachments to set
     */
    setAllowedAttachments(allowedAttachments: AutopilotChatAllowedAttachments) {
        this._config.allowedAttachments = allowedAttachments;

        this._internalService.publish(AutopilotChatInternalEvent.SetAllowedAttachments, allowedAttachments);
    }

    /**
     * Toggles the auto scroll in the chat service
     *
     * @param autoScroll - The auto scroll state to set
     */
    toggleAutoScroll(autoScroll: boolean) {
        this._internalService.publish(AutopilotChatInternalEvent.ToggleAutoScroll, autoScroll);
    }

    /**
     * Sets the models in the chat service
     *
     * @param models - The models to set
     */
    setModels(models: AutopilotChatModelInfo[]) {
        this._config.models = models;

        this._eventBus.publish(AutopilotChatEvent.SetModels, models);
    }

    /**
     * Gets the models from the chat service
     *
     * @returns The models
     */
    getModels() {
        return this._config.models;
    }

    /**
     * Sets the selected model in the chat service
     *
     * @param modelId - The model ID to set
     */
    setSelectedModel(modelId: string) {
        if (!this._config.models) {
            return;
        }

        const newSelectedModel = this._config.models.find(model => model.id === modelId);

        if (!newSelectedModel) {
            return;
        }

        this._config.selectedModel = newSelectedModel;

        this._eventBus.publish(AutopilotChatEvent.SetSelectedModel, newSelectedModel);
    }

    /**
     * Gets the selected model from the chat service
     *
     * @returns The selected model
     */
    getSelectedModel() {
        return this._config.selectedModel;
    }

    /**
     * Should not be consumed by the public API
     * @internal
     * @returns The internal service
     */
    get __internalService__() {
        return this._internalService;
    }

    /**
     * Gets the messages in a group
     *
     * @param groupId - The group ID to get the messages for
     * @returns The messages in the group
     */
    getMessagesInGroup(groupId: string) {
        return this._conversation.filter(message => message.groupId === groupId);
    }

    /**
     * Sets a pre hook in the chat service
     *
     * @param action - The action to set the pre hook for
     * @param hook - The pre hook to set
     */
    setPreHook(action: AutopilotChatPreHookAction, hook: (data?: any) => Promise<boolean>) {
        if (!this._config.preHooks) {
            this._config.preHooks = {};
        }

        this._config.preHooks[action] = hook;
    }

    /**
     * Gets the pre hook from the chat service
     *
     * @param action - The action to get the pre hook for
     * @returns The pre hook
     */
    getPreHook(action: AutopilotChatPreHookAction) {
        return this._config.preHooks?.[action] ?? (() => Promise.resolve(true));
    }
}
