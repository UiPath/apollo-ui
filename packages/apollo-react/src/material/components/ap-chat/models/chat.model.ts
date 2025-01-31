export enum AutopilotChatMode {
    Closed = 'closed',
    SideBySide = 'side-by-side',
    FullScreen = 'full-screen',
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
}

export interface AutopilotChatMessageRenderer {
    name: string;
    render: (container: HTMLElement, message: AutopilotChatMessage) => void | (() => void);
}

export enum AutopilotChatEvent {
    Open = 'open',
    Close = 'close',
    Message = 'message',
    Error = 'error',
    NewChat = 'newChat',
    ModeChange = 'modeChange',
}

export interface AutopilotChatEventHandlers {
    [AutopilotChatEvent.Open]?: (config: AutopilotChatConfiguration) => void;
    [AutopilotChatEvent.Close]?: () => void;
    [AutopilotChatEvent.Message]?: (message: AutopilotChatMessage) => void;
    [AutopilotChatEvent.Error]?: (error: string) => void;
    [AutopilotChatEvent.NewChat]?: () => void;
    [AutopilotChatEvent.ModeChange]?: (mode: AutopilotChatMode) => void;
}

export interface AutopilotChatConfiguration {
    mode: AutopilotChatMode;
    eventHandlers?: AutopilotChatEventHandlers;
}
