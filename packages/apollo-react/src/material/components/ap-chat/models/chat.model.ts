export enum AutopilotChatMode {
    Closed = 'closed',
    SideBySide = 'side-by-side',
    FullScreen = 'full-screen',
}

export enum AutopilotChatAccordionPosition {
    Left = 'left',
    Right = 'right',
}

export enum FileType {
    Word = 'Word',
    PowerPoint = 'PowerPoint',
    File = 'File',
}

export interface FileInfo {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    content: string | Uint8Array;
    icon: string;
    friendlyType: FileType;
}

export enum AutopilotChatRole {
    User = 'user',
    Assistant = 'assistant',
}

export interface AutopilotChatMessage {
    id: string;
    content: string;
    created_at: string;
    role: AutopilotChatRole;
    widget: string;
    attachments?: FileInfo[];
    hijacked?: boolean;
}

export interface AutopilotChatPrompt extends Pick<AutopilotChatMessage, 'content' | 'attachments'> {}

export interface AutopilotChatMessageRenderer {
    name: string;
    render: (container: HTMLElement, message: AutopilotChatMessage) => void | (() => void);
}

export enum AutopilotChatEvent {
    Open = 'open',
    Close = 'close',
    Error = 'error',
    NewChat = 'newChat',
    ModeChange = 'modeChange',
    SetPrompt = 'setPrompt',
    Request = 'request',
    Response = 'response',
}

export enum AutopilotChatInterceptableEvent {
    Request = AutopilotChatEvent.Request,
}

export enum AutopilotChatInternalEvent {
    ChatResize = 'chatResize',
}

export interface AutopilotChatEventHandlers {
    [AutopilotChatEvent.Open]?: (config: AutopilotChatConfiguration) => void;
    [AutopilotChatEvent.Close]?: () => void;
    [AutopilotChatEvent.Error]?: (error: string) => void;
    [AutopilotChatEvent.NewChat]?: () => void;
    [AutopilotChatEvent.ModeChange]?: (mode: AutopilotChatMode) => void;
    [AutopilotChatEvent.SetPrompt]?: (prompt: AutopilotChatPrompt | string) => void;
    [AutopilotChatEvent.Request]?: (request: string) => void;
    [AutopilotChatEvent.Response]?: (response: string) => void;
}

export interface AutopilotChatInternalEventHandlers {
    [AutopilotChatInternalEvent.ChatResize]?: (width: number) => void;
}

export type AutopilotChatEventHandler<T = any> = (data?: T) => void;
/** @returns true if the event is hijacked and should not be processed by apollo */
export type AutopilotChatEventInterceptor<T = any> = (data?: T) => boolean | Promise<boolean> | void;

export interface AutopilotChatConfiguration {
    mode: AutopilotChatMode;
    eventHandlers?: Array<{
        event: AutopilotChatEvent;
        handler: AutopilotChatEventHandlers;
    }>;
    interceptors?: Array<{
        event: AutopilotChatInterceptableEvent;
        interceptor: AutopilotChatEventInterceptor;
    }>;
}
