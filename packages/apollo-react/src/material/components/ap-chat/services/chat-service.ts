import { isDebuggingEnabled } from '../../../react/stencil-react-adapter/Utils/DebugUtils';
import type {
    AutopilotChatConfiguration,
    AutopilotChatEventHandler,
    AutopilotChatEventInterceptor,
    AutopilotChatMessage,
    AutopilotChatMessageRenderer,
    AutopilotChatMode,
    AutopilotChatPrompt,
} from '../models/chat.model';
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatRole,
} from '../models/chat.model';
import { EventBus } from './event-bus';

export class AutopilotChatService {
    private static instance: AutopilotChatService;
    private config: AutopilotChatConfiguration;
    private messageRenderers: AutopilotChatMessageRenderer[] = [];
    private eventBus: EventBus;
    private eventUnsubscribers: Array<() => void> = [];

    private constructor() {
        this.eventBus = new EventBus();

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
        this.setPrompt = this.setPrompt.bind(this);
        this.intercept = this.intercept.bind(this);
    }

    static Instantiate(config?: AutopilotChatConfiguration, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        if (!AutopilotChatService.instance) {
            AutopilotChatService.instance = new AutopilotChatService();
        }

        if (config) {
            AutopilotChatService.instance.initialize(config);
        }

        messageRenderers.forEach(renderer => AutopilotChatService.instance.injectMessageRenderer(renderer));

        return AutopilotChatService.instance;
    }

    static get Instance() {
        return AutopilotChatService.instance;
    }

    /**
     * @returns The current configuration
     */
    getConfig() {
        this._checkForConfig();

        return this.config;
    }

    /**
     * Initializes the chat service
     *
     * @param config - The configuration to use
     */
    initialize(config: AutopilotChatConfiguration, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        // Cleanup existing handlers
        this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.eventUnsubscribers = [];

        this.config = config;

        // Register handlers from config if they exist
        if (config.eventHandlers) {
            config.eventHandlers.forEach(({
                event, handler,
            }) => {
                if (typeof handler === 'function') {
                    this.eventUnsubscribers.push(
                        this.on(event as AutopilotChatEvent, handler),
                    );
                }
            });
        }

        if (config.interceptors) {
            config.interceptors.forEach(interceptor => {
                if (Object.values(AutopilotChatInterceptableEvent).includes(interceptor.event)) {
                    this.intercept(interceptor.event, interceptor.interceptor);
                }
            });
        }

        if (config.mode) {
            this.setChatMode(config.mode);
        }

        messageRenderers.forEach(renderer => this.injectMessageRenderer(renderer));
    }

    /**
     * Injects a message renderer into the chat service, overrides existing message renderer if it exists
     *
     * @param renderer - The message renderer to inject
     */
    injectMessageRenderer(renderer: AutopilotChatMessageRenderer) {
        this._checkForConfig();

        const existingRenderer = this.messageRenderers.find(r => r.name === renderer.name);

        if (existingRenderer) {
            const index = this.messageRenderers.indexOf(existingRenderer);
            this.messageRenderers[index] = renderer;
        } else {
            this.messageRenderers.push(renderer);
        }
    }

    /**
     * Gets a message renderer by name and defaults to the default renderer if not found
     *
     * @param name - The name of the message renderer to get
     * @returns The message renderer
     */
    getMessageRenderer(name: string) {
        this._checkForConfig();

        return this.messageRenderers.find(r => r.name === name);
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
        this._checkForConfig();

        const renderer = this.messageRenderers.find(r => r.name === message.widget);

        if (!renderer) {
            if (isDebuggingEnabled()) {
                // eslint-disable-next-line no-console
                console.warn(`AutopilotChatService: Message renderer with name ${name} not found, using markdown renderer`);
            }
        }

        if (!renderer?.render) {
            return;
        }

        renderer.render(container, message);
    }

    /**
     * Opens the chat service
     *
     * @param config - The configuration to use
     * @param messageRenderers - The custom message renderers to inject
     */
    open(config?: AutopilotChatConfiguration, messageRenderers: AutopilotChatMessageRenderer[] = []) {
        if (config) {
            this.initialize(config);
        }

        messageRenderers.forEach(renderer => this.injectMessageRenderer(renderer));

        this.eventBus.publish(AutopilotChatEvent.Open, this.config);
    }

    /**
     * Closes the chat service
     */
    close() {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.Close);
    }

    /**
     * Expands the chat window
     */
    setChatMode(mode: AutopilotChatMode) {
        this._checkForConfig();

        this.config.mode = mode;
        this.eventBus.publish(AutopilotChatEvent.ModeChange, mode);
    }

    /**
     * Sets a prompt in the chat service
     *
     * @param prompt - The prompt to set
     */
    setPrompt(prompt: AutopilotChatPrompt | string) {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.SetPrompt, prompt);
    }

    /**
     * Sends a request as an user request to the chat service
     *
     * @param request - The request to send
     */
    sendRequest(request: Omit<AutopilotChatMessage, 'role' | 'id' | 'created_at' > & { id?: string; created_at?: string }) {
        this._checkForConfig();

        const userMessage = {
            id: crypto.randomUUID(), // Generate a new ID in case it's not provided
            created_at: new Date().toISOString(),
            ...request,
            role: AutopilotChatRole.User,
        };

        this.eventBus.publish(AutopilotChatEvent.Request, userMessage);
    }

    /**
     * Stops the response in the chat service
     */
    stopResponse() {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.StopResponse);
    }

    /**
     * Sends a response as an AI assistant response to the chat service
     *
     * @param response - The response to send
     */
    sendResponse(response: Omit<AutopilotChatMessage, 'role' | 'id'> & { id?: string }) {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.Response, {
            id: crypto.randomUUID(),
            ...response,
            role: AutopilotChatRole.Assistant,
        });
    }

    /**
     * TODO: Implement new chat functionality
     */
    newChat() {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.NewChat);
    }
    /**
     * Sets an error in the chat service
     *
     * @param error - The error to set
     */
    setError(error: string) {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.Error, error);
    }

    /**
     * Clears the error in the chat service
     */
    clearError() {
        this._checkForConfig();

        this.eventBus.publish(AutopilotChatEvent.Error, undefined);
    }

    /**
     * Subscribes to an event
     *
     * @param event - The event to subscribe to
     * @param handler - The handler to subscribe to the event
     * @returns A function to unsubscribe from the event
     */
    on(event: AutopilotChatEvent, handler: AutopilotChatEventHandler, hijack?: boolean) {
        return this.eventBus.subscribe(event, handler, hijack);
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
            return this.eventBus.intercept(event, interceptor);
        }

        return () => {};
    }

    private _checkForConfig() {
        if (!this.config) {
            throw new Error('AutopilotChatService: No configuration found, please call the initialize method first');
        }
    }
}
