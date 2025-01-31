import { isDebuggingEnabled } from '../../../react/stencil-react-adapter/Utils/DebugUtils';
import type {
    AutopilotChatConfiguration,
    AutopilotChatMessage,
    AutopilotChatMessageRenderer,
    AutopilotChatMode,
} from '../models/chat.model';
import { AutopilotChatEvent } from '../models/chat.model';
import type { EventHandler } from './event-bus';
import { EventBus } from './event-bus';

export class AutopilotChatService {
    private static instance: AutopilotChatService;
    private config: AutopilotChatConfiguration;
    private messageRenderers: AutopilotChatMessageRenderer[] = [];
    private eventBus: EventBus;
    private eventUnsubscribers: Array<() => void> = [];
    private messages: AutopilotChatMessage[] = [];

    private constructor() {
        this.eventBus = new EventBus();

        this.getConfig = this.getConfig.bind(this);
        this.initialize = this.initialize.bind(this);
        this.on = this.on.bind(this);
        this.open = this.open.bind(this);
        this.injectMessageRenderer = this.injectMessageRenderer.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.close = this.close.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.setError = this.setError.bind(this);
        this.clearError = this.clearError.bind(this);
        this.newChat = this.newChat.bind(this);
        this.getMessages = this.getMessages.bind(this);
        this.setChatMode = this.setChatMode.bind(this);
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
            Object.entries(config.eventHandlers).forEach(([ event, handler ]) => {
                if (typeof handler === 'function') {
                    this.eventUnsubscribers.push(
                        this.on(event as AutopilotChatEvent, handler),
                    );
                }
            });
        }

        if (config.mode) {
            this.setChatMode(config.mode);
        }

        messageRenderers.forEach(renderer => this.injectMessageRenderer(renderer));
    }

    /**
     * Subscribes to an event
     *
     * @param event - The event to subscribe to
     * @param handler - The handler to subscribe to the event
     * @returns A function to unsubscribe from the event
     */
    on(event: AutopilotChatEvent, handler: EventHandler) {
        return this.eventBus.subscribe(event, handler);
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
        this.config.mode = mode;

        this.eventBus.publish(AutopilotChatEvent.ModeChange, mode);
    }

    /**
     * Sends a message to the chat service
     *
     * @param message - The message to send
     */
    sendMessage(message: AutopilotChatMessage) {
        this._checkForConfig();

        this.messages.push(message);
        this.eventBus.publish(AutopilotChatEvent.Message, message);
    }

    /**
     * Gets the messages from the chat service
     *
     * @returns The messages
     */
    getMessages() {
        return [ ...this.messages ];
    }

    /**
     * TODO: Implement new chat functionality
     */
    newChat() {
        this.messages = [];
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
        this.eventBus.publish(AutopilotChatEvent.Error, undefined);
    }

    private _checkForConfig() {
        if (!this.config) {
            throw new Error('AutopilotChatService: No configuration found, please call the initialize method first');
        }
    }
}
