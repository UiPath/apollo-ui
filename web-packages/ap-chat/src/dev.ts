/**
 * Development entry point for ap-chat web component playground
 * Comprehensive showcase of all ApChat features and capabilities
 */
import './index'; // Load the web component

import {
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatRole,
  AutopilotChatService,
} from './service';

// Add base styles
const iconStyles = document.createElement('style');
iconStyles.textContent = `
  * {
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overflow: hidden;
  }

  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1a1a1a;
  }

  body.dark {
    background: #1a1a1a;
    color: #ffffff;
  }

  body.light-hc {
    background: #ffffff;
    color: #000000;
  }

  body.dark-hc {
    background: #000000;
    color: #ffffff;
  }

  .showcase-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    gap: 0;
  }

  .control-panel {
    flex: 1 1 0;
    min-width: 0;
    padding: 24px;
    background: #ffffff;
    border-right: 2px solid #e0e0e0;
    overflow-y: auto;
  }

  body.dark .control-panel {
    background: #1a1a1a;
    border-right-color: #333333;
  }

  body.light-hc .control-panel {
    background: #ffffff;
    border-right-color: #000000;
  }

  body.dark-hc .control-panel {
    background: #000000;
    border-right-color: #ffffff;
  }

  .control-panel h2 {
    margin: 0 0 24px 0;
    color: #1a1a1a;
    font-size: 24px;
    font-weight: 700;
  }

  body.dark .control-panel h2,
  body.dark-hc .control-panel h2 {
    color: #ffffff;
  }

  .section {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #1a1a1a;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
  }

  body.dark .section-title {
    color: #ffffff;
    border-bottom-color: #333333;
  }

  body.light-hc .section-title {
    color: #000000;
    border-bottom-color: #000000;
  }

  body.dark-hc .section-title {
    color: #ffffff;
    border-bottom-color: #ffffff;
  }

  .button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  button {
    padding: 8px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #ffffff;
    color: #1a1a1a;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  body.dark button {
    background: #1a1a1a;
    color: #ffffff;
    border-color: #333333;
  }

  body.light-hc button {
    background: #ffffff;
    color: #000000;
    border-color: #000000;
  }

  body.dark-hc button {
    background: #000000;
    color: #ffffff;
    border-color: #ffffff;
  }

  button:hover {
    background: #f5f5f5;
    border-color: #0066CC;
  }

  body.dark button:hover {
    background: #2a2a2a;
    border-color: #0066CC;
  }

  body.light-hc button:hover {
    background: #f0f0f0;
    border-color: #0066CC;
  }

  body.dark-hc button:hover {
    background: #1a1a1a;
    border-color: #0066CC;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    width: 100%;
    max-width: 500px;
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #ffffff;
    color: #1a1a1a;
    font-size: 14px;
    font-family: inherit;
    margin-bottom: 12px;
  }

  body.dark input[type="text"],
  body.dark input[type="number"],
  body.dark textarea,
  body.dark select {
    background: #1a1a1a;
    color: #ffffff;
    border-color: #333333;
  }

  body.light-hc input[type="text"],
  body.light-hc input[type="number"],
  body.light-hc textarea,
  body.light-hc select {
    background: #ffffff;
    color: #000000;
    border-color: #000000;
  }

  body.dark-hc input[type="text"],
  body.dark-hc input[type="number"],
  body.dark-hc textarea,
  body.dark-hc select {
    background: #000000;
    color: #ffffff;
    border-color: #ffffff;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #0066CC;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .info-text {
    font-size: 12px;
    color: #666666;
    margin-top: 8px;
  }

  body.dark .info-text {
    color: #999999;
  }

  body.light-hc .info-text {
    color: #333333;
  }

  body.dark-hc .info-text {
    color: #cccccc;
  }

  .chat-container {
    position: relative;
    flex: 0 0 auto;
    min-width: 0;
  }

  .embedded-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    border-radius: 12px;
    border: 2px solid #e0e0e0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    background: #ffffff;
    display: none;
    overflow: hidden;
  }

  body.dark .embedded-container {
    background: #1a1a1a;
    border-color: #333333;
  }

  body.light-hc .embedded-container {
    background: #ffffff;
    border-color: #000000;
  }

  body.dark-hc .embedded-container {
    background: #000000;
    border-color: #ffffff;
  }

  .embedded-container.visible {
    display: block;
  }

  .fullscreen-mode .control-panel {
    display: none;
  }
`;
document.head.appendChild(iconStyles);

// Global state
let chatService: AutopilotChatService | null = null;
let chatElement: any = null;
let locale: string = 'en';
let theme: 'light' | 'dark' | 'light-hc' | 'dark-hc' = 'light';
let chatMode: AutopilotChatMode = AutopilotChatMode.SideBySide;
let embeddedContainerRef: HTMLElement | null = null;

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'light-hc' | 'dark-hc';
if (savedTheme) {
  theme = savedTheme;
}

// Feature state
const features = {
  history: true,
  settings: true,
  attachments: true,
  audio: true,
  htmlPreview: true,
  headerSeparator: false,
  fullHeight: true,
  resize: true,
  close: true,
  feedback: true,
  model: true,
  agentMode: true,
  sendOnClick: false,
  paginatedMessages: false,
  compactMode: false,
  customScrollTheme: false,
  copy: true,
  attachmentsAsync: false,
};

// Message state
let customMessage = 'Hello, how can I help you today?';
let errorMessage = 'An error occurred. Please try again.';
let streamingText = 'This is a streaming response that will appear word by word...';
let loadingMessage = 'Thinking...';
let waitForMore = false;
let autoScroll = true;
let isWaiting = false;
let isShowLoading = false;
let selectedAgentMode = 'agent';
let selectedModel = 'gpt-4';

// Custom settings renderer
function createSettingsRenderer() {
  return (container: HTMLElement) => {
    const settingsDiv = document.createElement('div');
    settingsDiv.style.padding = '24px';
    settingsDiv.style.color = 'inherit';

    settingsDiv.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Chat Settings</h2>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Appearance</h3>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
          <input type="checkbox" id="darkMode" style="cursor: pointer;" />
          <span>Dark Mode</span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" id="compactMode" checked style="cursor: pointer;" />
          <span>Compact Mode</span>
        </label>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Behavior</h3>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
          <input type="checkbox" id="autoScroll" checked style="cursor: pointer;" />
          <span>Auto-scroll to new messages</span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" id="soundEnabled" style="cursor: pointer;" />
          <span>Enable sound notifications</span>
        </label>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Advanced</h3>
        <label style="display: block; margin-bottom: 8px;">
          <span style="display: block; margin-bottom: 4px;">Max Messages</span>
          <input type="number" id="maxMessages" value="100" min="10" max="500"
            style="padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: inherit; color: inherit; width: 100px;" />
        </label>
        <label style="display: block;">
          <span style="display: block; margin-bottom: 4px;">Response Delay (ms)</span>
          <input type="number" id="responseDelay" value="0" min="0" max="5000" step="100"
            style="padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: inherit; color: inherit; width: 100px;" />
        </label>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="saveSettings" style="padding: 8px 16px; background: inherit; color: inherit; border: 2px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-weight: 500;">
          Save Settings
        </button>
        <button id="resetSettings" style="padding: 8px 16px; background: inherit; color: inherit; border: 2px solid #e0e0e0; border-radius: 4px; cursor: pointer;">
          Reset to Defaults
        </button>
      </div>
    `;

    // Add event listeners
    const darkModeCheckbox = settingsDiv.querySelector('#darkMode') as HTMLInputElement;
    darkModeCheckbox?.addEventListener('change', (e) => {
      console.log('Dark mode:', (e.target as HTMLInputElement).checked);
    });

    const saveButton = settingsDiv.querySelector('#saveSettings');
    saveButton?.addEventListener('click', () => {
      console.log('Settings saved:', {
        darkMode: (settingsDiv.querySelector('#darkMode') as HTMLInputElement).checked,
        compactMode: (settingsDiv.querySelector('#compactMode') as HTMLInputElement).checked,
        autoScroll: (settingsDiv.querySelector('#autoScroll') as HTMLInputElement).checked,
        soundEnabled: (settingsDiv.querySelector('#soundEnabled') as HTMLInputElement).checked,
        maxMessages: (settingsDiv.querySelector('#maxMessages') as HTMLInputElement).value,
        responseDelay: (settingsDiv.querySelector('#responseDelay') as HTMLInputElement).value,
      });
      alert('Settings saved successfully!');
    });

    const resetButton = settingsDiv.querySelector('#resetSettings');
    resetButton?.addEventListener('click', () => {
      (settingsDiv.querySelector('#darkMode') as HTMLInputElement).checked = false;
      (settingsDiv.querySelector('#compactMode') as HTMLInputElement).checked = true;
      (settingsDiv.querySelector('#autoScroll') as HTMLInputElement).checked = true;
      (settingsDiv.querySelector('#soundEnabled') as HTMLInputElement).checked = false;
      (settingsDiv.querySelector('#maxMessages') as HTMLInputElement).value = '100';
      (settingsDiv.querySelector('#responseDelay') as HTMLInputElement).value = '0';
      console.log('Settings reset to defaults');
    });

    container.appendChild(settingsDiv);
  };
}

// Initialize chat service
function initializeChatService() {
  chatService = AutopilotChatService.Instantiate({
    instanceName: 'dev-showcase',
  });
  chatService!.initialize({
    mode: AutopilotChatMode.SideBySide,
    disabledFeatures: {
      history: !features.history,
      settings: !features.settings,
      attachments: !features.attachments,
      audio: !features.audio,
      htmlPreview: !features.htmlPreview,
      headerSeparator: !features.headerSeparator,
      fullHeight: !features.fullHeight,
      resize: !features.resize,
      close: !features.close,
      feedback: !features.feedback,
      copy: !features.copy,
    },
    settingsRenderer: createSettingsRenderer(),
  });

  // Set up models
  chatService.setModels([
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
  ]);
  chatService.setSelectedModel('gpt-4');

  // Set up agent modes
  chatService.setAgentModes([
    {
      id: 'agent',
      name: 'Agent',
      description: 'AI-powered autonomous agent mode',
      icon: 'smart_toy',
    },
    {
      id: 'plan',
      name: 'Plan',
      description: 'Create and review execution plans',
      icon: 'edit_note',
    },
    {
      id: 'attended',
      name: 'Attended',
      description: 'Human assisted execution',
      icon: 'play_arrow',
    },
  ]);
  chatService.setAgentMode('agent');

  // Set up custom header actions
  chatService.setCustomHeaderActions([
    {
      id: 'export',
      name: 'Export Chat',
      icon: 'download',
    },
    {
      id: 'share',
      name: 'Share',
      icon: 'share',
    },
  ]);

  // Set up suggestions
  chatService.setSuggestions([
    { label: 'What can you do?', prompt: 'What can you do?' },
    { label: 'Show me an example', prompt: 'Show me an example' },
    { label: 'Help me with code', prompt: 'Help me with code' },
  ]);

  // Set default loading messages
  chatService.setDefaultLoadingMessages([
    'Thinking...',
    'Processing your request...',
    'Analyzing...',
    'Working on it...',
  ]);

  // Listen to events
  chatService.on(AutopilotChatEvent.Request, (data: any) => {
    console.log('Request sent:', data);
  });

  chatService.on(AutopilotChatEvent.ModeChange, (mode: any) => {
    console.log('Mode changed:', mode);
    chatMode = mode;
    updateUI();
  });

  chatService.on(AutopilotChatEvent.SetSelectedModel, (model: any) => {
    console.log('Model changed:', model);
    selectedModel = model?.id || model;
    updateModelSelect();
  });

  chatService.on(AutopilotChatEvent.SetSelectedAgentMode, (mode: any) => {
    console.log('Agent mode changed:', mode);
    selectedAgentMode = mode?.id;
    updateAgentModeSelect();
  });

  chatService.on('feedback' as any, (data: any) => {
    const { isPositive, message } = data;
    console.log(`Feedback: ${isPositive ? 'Positive' : 'Negative'}`, message);
  });

  chatService.on('copy' as any, (message: any) => {
    console.log('Copy event:', message);
  });

  chatService.on('attachments' as any, (attachments: any) => {
    console.log('Attachments:', attachments);
  });

  chatService.on('stopResponse' as any, () => {
    console.log('Stop response event');
  });

  chatService.on('customHeaderActionClicked' as any, (action: any) => {
    console.log('Custom header action clicked:', action);

    let responseContent = '';
    switch (action.id) {
      case 'export':
        responseContent = '📄 **Exporting...**\n\nYour conversation has been exported.';
        break;
      case 'share':
        responseContent = '🔗 **Share Conversation**\n\nA shareable link has been generated.';
        break;
      default:
        responseContent = `✅ Action triggered: **${action.name}** (ID: ${action.id})`;
    }

    chatService?.sendResponse({
      content: responseContent,
      groupId: `custom-action-${action.id}`,
      created_at: '22-10-2025',
      widget: 'apollo-markdown-renderer',
    });
  });

  return chatService;
}

// Update features
function updateFeatures() {
  if (!chatService) return;

  chatService.initialize({
    mode: chatMode,
    disabledFeatures: {
      history: !features.history,
      settings: !features.settings,
      attachments: !features.attachments,
      audio: !features.audio,
      htmlPreview: !features.htmlPreview,
      headerSeparator: !features.headerSeparator,
      fullHeight: !features.fullHeight,
      resize: !features.resize,
      close: !features.close,
      feedback: !features.feedback,
      copy: !features.copy,
    },
    settingsRenderer: createSettingsRenderer(),
    ...(chatMode === AutopilotChatMode.Embedded &&
      embeddedContainerRef && {
        embeddedContainer: embeddedContainerRef,
      }),
  });

  // Re-set models and agent modes
  if (features.model) {
    chatService.setModels([
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
      {
        id: 'gpt-3.5',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient',
      },
      { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
    ]);
    chatService.setSelectedModel(selectedModel);
  } else {
    chatService.setModels([]);
  }

  if (features.agentMode) {
    chatService.setAgentModes([
      {
        id: 'agent',
        name: 'Agent',
        description: 'AI-powered autonomous agent mode',
        icon: 'smart_toy',
      },
      {
        id: 'plan',
        name: 'Plan',
        description: 'Create and review execution plans',
        icon: 'edit_note',
      },
      {
        id: 'attended',
        name: 'Attended',
        description: 'Human assisted execution',
        icon: 'play_arrow',
      },
    ]);
    chatService.setAgentMode(selectedAgentMode);
  } else {
    chatService.setAgentModes([]);
  }

  chatService.patchConfig({
    paginatedMessages: features.paginatedMessages,
    spacing: {
      compactMode: features.compactMode,
    },
    theming: {
      scrollBar: features.customScrollTheme
        ? {
            scrollThumbColor: '#000000',
            scrollSize: '16px',
            scrollHoverColor: '#888888',
            scrollBorderRadius: '8px',
          }
        : undefined,
    },
  });

  // Handle attachments async
  if (features.attachmentsAsync) {
    chatService.on('setAttachments' as any, (attachments: any) => {
      chatService?.setAttachmentsLoading(
        attachments.added.map((attachment: any) => ({
          ...attachment,
          loading: true,
        }))
      );

      setTimeout(() => {
        chatService?.setAttachmentsLoading(
          attachments.added.map((attachment: any) => ({
            ...attachment,
            loading: false,
          }))
        );
      }, 2000);
    });
  } else {
    chatService.setAttachmentsLoading([]);
  }
}

// Theme management
function applyTheme(newTheme: 'light' | 'dark' | 'light-hc' | 'dark-hc') {
  theme = newTheme;

  // Remove all theme classes
  document.body.classList.remove('light', 'dark', 'light-hc', 'dark-hc');

  // Add the new theme class
  document.body.classList.add(newTheme);

  // Save to localStorage
  localStorage.setItem('theme', newTheme);

  // Update chat service theme
  if (chatService) {
    chatService.setTheme(newTheme);
  }

  // Update chat element theme prop (for React component re-render with new MUI theme)
  if (chatElement) {
    chatElement.theme = newTheme;
  }

  console.log(`Theme changed to: ${newTheme}`);
}

// Control functions
function openChat() {
  chatService?.open();
}

function closeChat() {
  chatService?.close();
}

function setFullScreen() {
  chatService?.setChatMode(AutopilotChatMode.FullScreen);
  chatMode = AutopilotChatMode.FullScreen;
  updateUI();
}

function setSideBySide() {
  chatService?.setChatMode(AutopilotChatMode.SideBySide);
  chatMode = AutopilotChatMode.SideBySide;
  updateUI();
}

function setEmbedded() {
  chatMode = AutopilotChatMode.Embedded;
  chatService?.setChatMode(AutopilotChatMode.Embedded);
  if (embeddedContainerRef) {
    chatService?.patchConfig({
      mode: AutopilotChatMode.Embedded,
      embeddedContainer: embeddedContainerRef,
      spacing: {
        promptBox: {
          minRows: 2,
          maxRows: 4,
        },
      },
    });
  }
  updateUI();
}

function sendSimpleRequest() {
  chatService?.sendRequest({
    content: customMessage,
  });
}

function sendSimpleResponse() {
  chatService?.sendResponse({
    content: customMessage,
    created_at: '22-10-2025',
    widget: 'apollo-markdown-renderer',
    shouldWaitForMoreMessages: waitForMore,
  });
}

function sendResponseWithActions() {
  chatService?.sendResponse({
    content: 'Here is a response with custom actions. Try the buttons below!',
    created_at: '22-10-2025',
    widget: 'apollo-markdown-renderer',
    actions: [
      {
        name: 'copy-action',
        label: 'Copy to Clipboard',
        icon: 'content_copy',
        eventName: 'copy-custom',
      },
      {
        name: 'regenerate-action',
        label: 'Regenerate',
        icon: 'refresh',
        eventName: 'regenerate-custom',
      },
    ],
  });

  chatService?.on('copy-custom' as any, () => {
    navigator.clipboard.writeText('Response copied!');
    alert('Copied to clipboard!');
  });

  chatService?.on('regenerate-custom' as any, () => {
    alert('Regenerating response...');
  });
}

function sendResponseWithCitations() {
  chatService?.sendResponse({
    content:
      'According to research, the sky is blue due to Rayleigh scattering. See references below for more information.',
    widget: 'default',
    contentParts: [
      {
        text: 'According to research, the sky is blue due to Rayleigh scattering. ',
        citations: [
          {
            id: 1,
            title: 'Why is the Sky Blue?',
            url: 'https://example.com/sky',
          },
        ],
      },
      {
        text: 'See references below for more information.',
        citations: [
          {
            id: 2,
            title: 'Atmospheric Science',
            url: 'https://example.com/atmosphere',
          },
        ],
      },
    ],
  } as any);
}

function sendStreamingResponse() {
  chatService?.sendResponse({
    content: streamingText,
    fakeStream: true,
    shouldWaitForMoreMessages: waitForMore,
  } as any);
}

function sendCodeBlock() {
  const codeContent = `\`\`\`typescript
// This is a long comment line that should wrap properly when displayed in the code block
interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: { theme: 'light' | 'dark'; language: string; notifications: boolean };
}

function processUserData(user: UserProfile): string {
  const fullName = \`\${user.firstName} \${user.lastName}\`;
  return \`User: \${fullName} (\${user.email})\`;
}
\`\`\``;

  chatService?.sendResponse({
    content: `Here's a TypeScript example with long lines to test wrapping:\n\n${codeContent}`,
    widget: 'default',
  } as any);
}

function sendHTMLPreview() {
  const htmlContent = `\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Hello World</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; }
    h1 { color: #fa4616; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is an HTML preview example.</p>
</body>
</html>
\`\`\``;

  chatService?.sendResponse({
    content: `Here's an HTML example with live preview:\n\n${htmlContent}`,
    widget: 'default',
  } as any);
}

function showLoading() {
  chatService?.setLoadingMessage(loadingMessage);
}

function hideLoading() {
  chatService?.setLoadingMessage('');
}

function showError() {
  chatService?.setError(errorMessage);
}

function showWarning() {
  chatService?.setError('This is a warning message.');
}

function clearErrors() {
  chatService?.clearError();
}

function toggleHistory() {
  chatService?.toggleHistory();
}

function addHistoryItems() {
  chatService?.setHistory([
    {
      id: '1',
      name: 'Previous Conversation 1',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      name: 'Previous Conversation 2',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      name: 'Previous Conversation 3',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
  ]);
}

function clearChat() {
  chatService?.newChat();
}

function setPrompt() {
  chatService?.setPrompt('I need something to be done');
}

function resetPrompt() {
  chatService?.setPrompt('');
}

function stopResponse() {
  chatService?.stopResponse();
}

function toggleAutoScroll() {
  autoScroll = !autoScroll;
  chatService?.toggleAutoScroll(autoScroll);
  updateAutoScrollCheckbox();
}

function setAllowedAttachments() {
  chatService?.setAllowedAttachments({
    types: {
      'text/csv': ['.csv'],
    },
    maxSize: 1024 * 1024,
    multiple: false,
  });
  alert('Allowed attachments set to: CSV files only, max 1MB');
}

function setFirstRunExperience() {
  chatService?.setFirstRunExperience({
    title: 'Welcome to UiPath Autopilot',
    description:
      "I'm here to help you build, understand, and troubleshoot your automation projects.",
    suggestions: [
      {
        label: 'New process',
        prompt:
          'Can you provide a detailed step-by-step guide on how to create a new automation process?',
      },
      {
        label: 'Debug workflow',
        prompt:
          "I'm having trouble with my workflow execution. Can you explain debugging techniques?",
      },
      {
        label: 'Studio updates',
        prompt: 'What are the latest features in UiPath Studio?',
      },
    ],
  });
}

function setConversation() {
  chatService?.setConversation([
    {
      id: '1',
      role: AutopilotChatRole.User,
      content: 'How do I create a workflow that extracts data from invoices?',
      created_at: '22-10-2022',
      widget: '',
    },
    {
      id: '2',
      role: AutopilotChatRole.Assistant,
      content:
        'To extract data from invoices, you can use UiPath Document Understanding. Here\'s a step-by-step approach:\n\n1. Install the Document Understanding package\n2. Create a new workflow and add the "Digitize Document" activity\n3. Configure it to use ML skills\n4. Use the "Data Extraction" activity\n5. Validate the extracted data',
      created_at: '23-10-2022',
      widget: '',
    },
  ]);
}

function setSuggestions() {
  chatService?.setSuggestions(
    [
      { label: 'What can you do?', prompt: 'What can you do?' },
      { label: 'Show me an example', prompt: 'Show me an example' },
      { label: 'Help me with code', prompt: 'Help me with code' },
    ],
    true
  );
}

function sendToolCall() {
  chatService?.sendResponse({
    content: 'Tool call response',
    widget: 'apollo-agents-tool-call',
    meta: {
      input: {
        provider: 'GoogleCustomSearch',
        query: 'most interesting scientific fact discovered recently 2025',
        num: 5,
      },
      output: {
        results: [
          {
            snippet: 'Breaking science news and articles...',
            title: 'ScienceDaily: Latest Research News',
            url: 'https://www.sciencedaily.com/',
          },
        ],
      },
      isError: false,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      toolName: 'Web_Search',
    },
  } as any);
}

function sendResponseDisabledActions() {
  chatService?.sendResponse({
    content: 'Message with no actions',
    disableActions: true,
  } as any);
}

function setPreHook() {
  const actions = ['new-chat', 'toggle-history', 'toggle-chat', 'close-chat', 'feedback'];
  actions.forEach((action) => {
    chatService?.setPreHook(action as any, async () => {
      return confirm(`${action} pre hook. Continue?`);
    });
  });
  alert('Pre-hooks set for all actions');
}

function setCustomHeaderActions() {
  chatService?.setCustomHeaderActions([
    {
      id: 'export',
      name: 'Export',
      icon: 'download',
      description: 'Export conversation in various formats',
      children: [
        {
          id: 'export-pdf',
          name: 'Export as PDF',
          icon: 'picture_as_pdf',
          description: 'Download conversation as PDF file',
        },
        {
          id: 'export-docx',
          name: 'Export as DOCX',
          icon: 'description',
          description: 'Download conversation as Word document',
        },
      ],
    },
    {
      id: 'share',
      name: 'Share Conversation',
      icon: 'share',
      description: 'Share this conversation with others',
    },
  ] as any);
}

function clearCustomHeaderActions() {
  chatService?.setCustomHeaderActions([]);
}

function streamWithCitations() {
  const messageId = `streaming-citations-${Date.now()}`;
  let streamIndex = 0;

  const streamingParts = [
    { index: 0, text: 'Based on the search results' },
    { index: 0, text: ", I'll" },
    { index: 0, text: ' create a comprehensive summary' },
    {
      index: 0,
      text: '',
      citation: {
        id: 1,
        title: 'Example Citation',
        url: 'https://example.com',
      },
    },
  ];

  const streamChunk = () => {
    if (streamIndex >= streamingParts.length) {
      return;
    }

    const chunk = streamingParts[streamIndex];
    if (!chunk) return;

    chatService?.sendResponse({
      id: messageId,
      contentPartChunk: {
        index: chunk.index,
        text: chunk.text,
        ...((chunk as any).citation && { citation: (chunk as any).citation }),
      },
      stream: true,
      done: streamIndex === streamingParts.length - 1,
    } as any);

    streamIndex++;

    if (streamIndex < streamingParts.length) {
      setTimeout(streamChunk, 100);
    }
  };

  streamChunk();
}

// Update UI functions
function updateUI() {
  const container = document.querySelector('.showcase-container');
  if (chatMode === AutopilotChatMode.FullScreen) {
    container?.classList.add('fullscreen-mode');
  } else {
    container?.classList.remove('fullscreen-mode');
  }

  const embeddedContainer = document.querySelector('.embedded-container');
  if (chatMode === AutopilotChatMode.Embedded) {
    embeddedContainer?.classList.add('visible');
  } else {
    embeddedContainer?.classList.remove('visible');
  }
}

function updateModelSelect() {
  const select = document.getElementById('model-select') as HTMLSelectElement;
  if (select) {
    select.value = selectedModel;
  }
}

function updateAgentModeSelect() {
  const select = document.getElementById('agent-mode-select') as HTMLSelectElement;
  if (select) {
    select.value = selectedAgentMode;
  }
}

function updateAutoScrollCheckbox() {
  const checkbox = document.getElementById('auto-scroll-checkbox') as HTMLInputElement;
  if (checkbox) {
    checkbox.checked = autoScroll;
  }
}

// Create UI
function createUI() {
  // Apply initial theme
  applyTheme(theme);

  const showcaseContainer = document.createElement('div');
  showcaseContainer.className = 'showcase-container';

  // Control panel
  const controlPanel = document.createElement('div');
  controlPanel.className = 'control-panel';
  // codeql[js/xss-through-dom] - This is dev-only showcase code with trusted static content
  controlPanel.innerHTML = `
    <h2>ApChat Showcase</h2>

    <div class="section">
      <div class="section-title">Locale</div>
      <select id="locale-select">
        <option value="en">English (en)</option>
        <option value="de">German (de)</option>
        <option value="es">Spanish (es)</option>
        <option value="es-MX">Spanish - Mexico (es-MX)</option>
        <option value="fr">French (fr)</option>
        <option value="ja">Japanese (ja)</option>
        <option value="ko">Korean (ko)</option>
        <option value="pt">Portuguese (pt)</option>
        <option value="pt-BR">Portuguese - Brazil (pt-BR)</option>
        <option value="ru">Russian (ru)</option>
        <option value="tr">Turkish (tr)</option>
        <option value="zh-CN">Chinese - Simplified (zh-CN)</option>
        <option value="zh-TW">Chinese - Traditional (zh-TW)</option>
      </select>
    </div>

    <div class="section">
      <div class="section-title">Theme</div>
      <select id="theme-select">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="light-hc">Light High Contrast</option>
        <option value="dark-hc">Dark High Contrast</option>
      </select>
    </div>

    <div class="section">
      <div class="section-title">Chat Mode Controls</div>
      <div class="button-group">
        <button class="primary" id="open-chat">Open Chat</button>
        <button id="close-chat">Close Chat</button>
      </div>
      <div class="button-group">
        <button id="side-by-side">Side by Side</button>
        <button id="fullscreen">Full Screen</button>
        <button id="embedded">Embedded</button>
      </div>
      <div class="button-group">
        <button id="toggle-auto-scroll">Toggle Auto Scroll</button>
        <button id="clear-chat">Clear Chat</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Chat Setup</div>
      <div class="button-group">
        <button id="set-allowed-attachments">Set Allowed Attachments</button>
        <button id="set-pre-hook">Set Pre Hook</button>
      </div>
      <div class="button-group">
        <button id="set-first-run">Set First Run Experience</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Custom Header Actions</div>
      <div class="button-group">
        <button id="set-custom-header">Set Custom Header Actions</button>
        <button id="clear-custom-header">Clear Custom Header Actions</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Model Selection</div>
      <select id="model-select">
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-3.5">GPT-3.5 Turbo</option>
        <option value="claude-3">Claude 3</option>
      </select>
    </div>

    <div class="section">
      <div class="section-title">Agent Mode</div>
      <select id="agent-mode-select">
        <option value="agent">Agent</option>
        <option value="plan">Plan</option>
        <option value="attended">Attended</option>
      </select>
    </div>

    <div class="section">
      <div class="section-title">Message Controls</div>
      <div class="button-group">
        <button id="set-prompt">Set Prompt</button>
        <button id="reset-prompt">Reset Prompt</button>
      </div>
      <input type="text" id="custom-message" placeholder="Custom message" value="${customMessage}">
      <div class="button-group">
        <button id="send-request">Send Request</button>
        <button id="send-response">Send Response</button>
        <button id="stop-response">Stop Response</button>
      </div>
      <div class="button-group">
        <button id="send-with-actions">With Actions</button>
        <button id="send-with-citations">With Citations</button>
      </div>
      <div class="button-group">
        <button id="send-code-block">Code Block</button>
        <button id="send-html">HTML Preview</button>
      </div>
      <div class="button-group">
        <button id="send-tool-call">Send Tool Call</button>
        <button id="send-disabled-actions">Disabled Actions</button>
      </div>
      <div class="button-group">
        <button id="set-conversation">Set Conversation</button>
        <button id="set-suggestions">Set Suggestions</button>
      </div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="wait-for-more" ${waitForMore ? 'checked' : ''}>
          Wait For More Messages
        </label>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Streaming</div>
      <textarea id="streaming-text" placeholder="Text to stream">${streamingText}</textarea>
      <div class="button-group">
        <button id="stream-response">Stream Response</button>
        <button id="stream-citations">Stream With Citations</button>
      </div>
      <div class="info-text">Streams the text word by word</div>
    </div>

    <div class="section">
      <div class="section-title">Loading & Error States</div>
      <input type="text" id="loading-message" placeholder="Loading message" value="${loadingMessage}">
      <div class="button-group">
        <button id="show-loading">Show Loading</button>
        <button id="hide-loading">Hide Loading</button>
      </div>
      <input type="text" id="error-message" placeholder="Error message" value="${errorMessage}">
      <div class="button-group">
        <button id="show-error">Show Error</button>
        <button id="show-warning">Show Warning</button>
        <button id="clear-errors">Clear Errors</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">History</div>
      <div class="button-group">
        <button id="add-history">Add History Items</button>
        <button id="toggle-history">Toggle History Panel</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Feature Toggles</div>
      <div class="checkbox-group">
        ${Object.entries(features)
          .map(
            ([key, value]) => `
          <label class="checkbox-label">
            <input type="checkbox" class="feature-toggle" data-feature="${key}" ${value ? 'checked' : ''}>
            ${key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .trim()}
          </label>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">State Controls</div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="is-waiting" ${isWaiting ? 'checked' : ''}>
          Set Waiting
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="is-show-loading" ${isShowLoading ? 'checked' : ''}>
          Set Show Loading
        </label>
      </div>
    </div>
  `;

  showcaseContainer.appendChild(controlPanel);

  // Chat container
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  chatElement = document.createElement('ap-chat') as any;
  chatElement.chatServiceInstance = chatService;
  chatElement.locale = locale;
  chatElement.theme = theme;

  chatContainer.appendChild(chatElement);
  showcaseContainer.appendChild(chatContainer);

  // Embedded container
  embeddedContainerRef = document.createElement('div');
  embeddedContainerRef.className = 'embedded-container';
  showcaseContainer.appendChild(embeddedContainerRef);

  document.body.appendChild(showcaseContainer);

  // Add event listeners
  document.getElementById('locale-select')?.addEventListener('change', (e) => {
    locale = (e.target as HTMLSelectElement).value;
    chatService?.setLocale(locale);
    chatElement.locale = locale;
  });

  document.getElementById('theme-select')?.addEventListener('change', (e) => {
    const newTheme = (e.target as HTMLSelectElement).value as
      | 'light'
      | 'dark'
      | 'light-hc'
      | 'dark-hc';
    applyTheme(newTheme);
  });

  document.getElementById('open-chat')?.addEventListener('click', openChat);
  document.getElementById('close-chat')?.addEventListener('click', closeChat);
  document.getElementById('side-by-side')?.addEventListener('click', setSideBySide);
  document.getElementById('fullscreen')?.addEventListener('click', setFullScreen);
  document.getElementById('embedded')?.addEventListener('click', setEmbedded);
  document.getElementById('toggle-auto-scroll')?.addEventListener('click', toggleAutoScroll);
  document.getElementById('clear-chat')?.addEventListener('click', clearChat);

  document
    .getElementById('set-allowed-attachments')
    ?.addEventListener('click', setAllowedAttachments);
  document.getElementById('set-pre-hook')?.addEventListener('click', setPreHook);
  document.getElementById('set-first-run')?.addEventListener('click', setFirstRunExperience);

  document.getElementById('set-custom-header')?.addEventListener('click', setCustomHeaderActions);
  document
    .getElementById('clear-custom-header')
    ?.addEventListener('click', clearCustomHeaderActions);

  document.getElementById('model-select')?.addEventListener('change', (e) => {
    selectedModel = (e.target as HTMLSelectElement).value;
    chatService?.setSelectedModel(selectedModel);
  });

  document.getElementById('agent-mode-select')?.addEventListener('change', (e) => {
    selectedAgentMode = (e.target as HTMLSelectElement).value;
    chatService?.setAgentMode(selectedAgentMode);
  });

  document.getElementById('set-prompt')?.addEventListener('click', setPrompt);
  document.getElementById('reset-prompt')?.addEventListener('click', resetPrompt);
  document.getElementById('custom-message')?.addEventListener('input', (e) => {
    customMessage = (e.target as HTMLInputElement).value;
  });
  document.getElementById('send-request')?.addEventListener('click', sendSimpleRequest);
  document.getElementById('send-response')?.addEventListener('click', sendSimpleResponse);
  document.getElementById('stop-response')?.addEventListener('click', stopResponse);
  document.getElementById('send-with-actions')?.addEventListener('click', sendResponseWithActions);
  document
    .getElementById('send-with-citations')
    ?.addEventListener('click', sendResponseWithCitations);
  document.getElementById('send-code-block')?.addEventListener('click', sendCodeBlock);
  document.getElementById('send-html')?.addEventListener('click', sendHTMLPreview);
  document.getElementById('send-tool-call')?.addEventListener('click', sendToolCall);
  document
    .getElementById('send-disabled-actions')
    ?.addEventListener('click', sendResponseDisabledActions);
  document.getElementById('set-conversation')?.addEventListener('click', setConversation);
  document.getElementById('set-suggestions')?.addEventListener('click', setSuggestions);

  document.getElementById('wait-for-more')?.addEventListener('change', (e) => {
    waitForMore = (e.target as HTMLInputElement).checked;
  });

  document.getElementById('streaming-text')?.addEventListener('input', (e) => {
    streamingText = (e.target as HTMLTextAreaElement).value;
  });
  document.getElementById('stream-response')?.addEventListener('click', sendStreamingResponse);
  document.getElementById('stream-citations')?.addEventListener('click', streamWithCitations);

  document.getElementById('loading-message')?.addEventListener('input', (e) => {
    loadingMessage = (e.target as HTMLInputElement).value;
  });
  document.getElementById('show-loading')?.addEventListener('click', showLoading);
  document.getElementById('hide-loading')?.addEventListener('click', hideLoading);

  document.getElementById('error-message')?.addEventListener('input', (e) => {
    errorMessage = (e.target as HTMLInputElement).value;
  });
  document.getElementById('show-error')?.addEventListener('click', showError);
  document.getElementById('show-warning')?.addEventListener('click', showWarning);
  document.getElementById('clear-errors')?.addEventListener('click', clearErrors);

  document.getElementById('add-history')?.addEventListener('click', addHistoryItems);
  document.getElementById('toggle-history')?.addEventListener('click', toggleHistory);

  // Feature toggles
  document.querySelectorAll('.feature-toggle').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const feature = (e.target as HTMLInputElement).dataset.feature as keyof typeof features;
      features[feature] = (e.target as HTMLInputElement).checked;
      updateFeatures();
    });
  });

  document.getElementById('is-waiting')?.addEventListener('change', (e) => {
    isWaiting = (e.target as HTMLInputElement).checked;
    chatService?.setWaiting(isWaiting);
  });

  document.getElementById('is-show-loading')?.addEventListener('change', (e) => {
    isShowLoading = (e.target as HTMLInputElement).checked;
    chatService?.setShowLoading(isShowLoading);
  });

  // Set initial dropdown values
  const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
  if (localeSelect) {
    localeSelect.value = locale;
  }

  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  if (themeSelect) {
    themeSelect.value = theme;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  chatService = initializeChatService();
  createUI();
  chatService.open();

  console.log('[DEV] AP Chat showcase initialized with full functionality');
});
