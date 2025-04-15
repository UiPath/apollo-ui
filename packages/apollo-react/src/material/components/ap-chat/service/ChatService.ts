import type {
    AutopilotChatAllowedAttachments,
    AutopilotChatConfiguration,
    AutopilotChatDisabledFeatures,
    AutopilotChatEventHandler,
    AutopilotChatEventInterceptor,
    AutopilotChatHistory,
    AutopilotChatMessage,
    AutopilotChatMessageRenderer,
    AutopilotChatPrompt,
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
    CHAT_MODE_KEY,
    DEFAULT_MESSAGE_RENDERER,
} from './ChatConstants';
import { AutopilotChatInternalService } from './ChatInternalService';
import { EventBus } from './EventBus';
import { LocalHistoryService } from './LocalHistory';
import { StorageService } from './StorageService';

export class AutopilotChatService {
    private static _instances: Record<string, AutopilotChatService> = {};
    private _initialConfig: AutopilotChatConfiguration = {
        mode: StorageService.Instance.get(CHAT_MODE_KEY) as AutopilotChatMode
            ?? AutopilotChatMode.Closed,
        allowedAttachments: {
            multiple: true,
            types: ACCEPTED_FILES,
            maxSize: ACCEPTED_FILE_MAX_SIZE,
            maxCount: ACCEPTED_FILE_MAX_COUNT,
        },
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
    private _activeConversationId: string | null = null;
    private _internalService: AutopilotChatInternalService;
    private _defaultLoadingMessages: string[] = [];
    private _loadingMessage: string | null = null;
    private _loadingMessageDuration: number | null = null;

    private constructor(instanceName: string) {
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
        this.setLoadingMessage = this.setLoadingMessage.bind(this);
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
        this.deleteConversation = this.deleteConversation.bind(this);
        this.openConversation = this.openConversation.bind(this);
        this.setAllowedAttachments = this.setAllowedAttachments.bind(this);
    }

    static Instantiate({
        instanceName = 'portal-shell',
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

    static getInstance(instanceName: string = 'portal-shell') {
        return AutopilotChatService._instances[instanceName];
    }

    /**
     * @returns The current active conversation ID
     */
    public get activeConversationId() {
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
        StorageService.Instance.set(CHAT_MODE_KEY, mode);
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
     * Sets a conversation in the chat service
     *
     * @param messages - The messages to set
     */
    setConversation(messages: AutopilotChatMessage[]) {
        this._conversation = messages;

        this._eventBus.publish(AutopilotChatEvent.SetConversation, messages);
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
        const userMessage = {
            id: crypto.randomUUID(), // Generate a new ID in case it's not provided
            created_at: new Date().toISOString(),
            ...request,
            role: AutopilotChatRole.User,
            widget: DEFAULT_MESSAGE_RENDERER,
        };

        this.setPrompt('');
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
        const assistantMessage = {
            id: crypto.randomUUID(),
            ...response,
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
                this._eventBus.publish(AutopilotChatEvent.SendChunk, assistantMessage);
            } else {
                // send response if the response is not streaming
                this._conversation[existingIndex].content = assistantMessage.content;
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
    public setDefaultLoadingMessages(messages: string[], duration?: number) {
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
    public getDefaultLoadingMessages() {
        return this._defaultLoadingMessages;
    }

    /**
     * Gets the current loading message duration
     *
     * @returns The loading message duration in milliseconds
     */
    public getLoadingMessageDuration() {
        return this._loadingMessageDuration;
    }

    /**
     * Sets a single loading message in the chat service
     *
     * @param message - The message to show in the loading state
     */
    public setLoadingMessage(message: string) {
        this._loadingMessage = message;

        this._eventBus.publish(AutopilotChatEvent.SetLoadingMessage, message);
    }

    /**
     * Gets the current loading message
     *
     * @returns The loading message
     */
    public getLoadingMessage() {
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

        this._conversation = [];
        this._eventBus.publish(AutopilotChatEvent.NewChat);
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
     * Toggles the history in the chat service
     *
     * @param open - The open state to set (optional, defaults to toggle)
     */
    toggleHistory(open?: boolean) {
        this._historyOpen = open ?? !this._historyOpen;

        this._internalService.publish(AutopilotChatInternalEvent.ToggleHistory, this._historyOpen);
    }

    /**
     * Deletes a conversation from the chat service
     *
     * @param conversationId - The conversation ID to delete
     */
    deleteConversation(conversationId: string) {
        if (conversationId === this._activeConversationId) {
            this._activeConversationId = null;
        }

        this._eventBus.publish(AutopilotChatEvent.DeleteConversation, conversationId);
    }

    /**
     * Opens a conversation from the chat service
     *
     * @param conversationId - The conversation ID to open
     */
    openConversation(conversationId: string | null) {
        this._activeConversationId = conversationId;
        this._eventBus.publish(AutopilotChatEvent.OpenConversation, conversationId);
    }

    /**
     * Sets the allowed attachments in the chat service
     *
     * @param allowedAttachments - The allowed attachments to set
     */
    setAllowedAttachments(allowedAttachments: AutopilotChatAllowedAttachments) {
        this._config.allowedAttachments = allowedAttachments;

        AutopilotChatInternalService.Instance.publish(AutopilotChatInternalEvent.SetAllowedAttachments, allowedAttachments);
    }
    /**
     * Should not be consumed by the public API
     * @internal
     * @returns The internal service
     */
    get __internalService__() {
        return this._internalService;
    }
}
