import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const Settings = (args) => template(args, 'settings');

Settings.args = {
    ...defaultArgs,
    settingsDisabled: false, // Enable settings for this story
};

Settings.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'settings';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    // Initialize chat service first
    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Create simple working settings renderer with chatService in scope
    const settingsRenderer = (element) => {
        element.innerHTML = `
            <div style="padding: 20px; font-family: system-ui;">
                <h3 style="margin-top: 0; margin-bottom: 20px; color: #2c3e50;">Chat Settings</h3>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #34495e;">Appearance</h4>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="dark-mode" style="margin-right: 8px;" />
                        Dark mode
                    </label>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="compact-view" style="margin-right: 8px;" />
                        Compact view
                    </label>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #34495e;">Notifications</h4>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="sound-enabled" checked style="margin-right: 8px;" />
                        Sound notifications
                    </label>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="desktop-notifications" style="margin-right: 8px;" />
                        Desktop notifications
                    </label>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #34495e;">Language</h4>
                    <select id="language-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #34495e;">Advanced</h4>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="auto-save" checked style="margin-right: 8px;" />
                        Auto-save conversations
                    </label>
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" id="typing-indicator" checked style="margin-right: 8px;" />
                        Show typing indicator
                    </label>
                </div>

                <div style="border-top: 1px solid #eee; padding-top: 15px;">
                    <button id="save-settings" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Save Settings</button>
                    <button id="reset-settings" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Reset</button>
                </div>
            </div>
        `;

        // Add simple event listeners
        const saveButton = element.querySelector('#save-settings');
        const resetButton = element.querySelector('#reset-settings');

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                // Get all settings values
                const settings = {
                    darkMode: element.querySelector('#dark-mode').checked,
                    compactView: element.querySelector('#compact-view').checked,
                    soundEnabled: element.querySelector('#sound-enabled').checked,
                    desktopNotifications: element.querySelector('#desktop-notifications').checked,
                    language: element.querySelector('#language-select').value,
                    autoSave: element.querySelector('#auto-save').checked,
                    typingIndicator: element.querySelector('#typing-indicator').checked,
                };

                // Apply settings to chat service
                chatService.patchConfig({ overrideLabels: { language: settings.language } });

                // Store settings
                localStorage.setItem('chatSettings', JSON.stringify(settings));

                // Show confirmation message
                chatService.sendResponse({
                    content: `✅ **Settings saved successfully!**

**Current Configuration:**
- Theme: ${settings.darkMode ? 'Dark' : 'Light'}
- Layout: ${settings.compactView ? 'Compact' : 'Standard'}
- Sound: ${settings.soundEnabled ? 'Enabled' : 'Disabled'}
- Language: ${settings.language.toUpperCase()}
- Auto-save: ${settings.autoSave ? 'On' : 'Off'}

Your preferences have been updated.`,
                });

                // Close settings panel after a moment
                setTimeout(() => {
                    chatService.toggleSettings(false);
                }, 2000);
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Reset all checkboxes and selects to defaults
                element.querySelector('#dark-mode').checked = false;
                element.querySelector('#compact-view').checked = false;
                element.querySelector('#sound-enabled').checked = true;
                element.querySelector('#desktop-notifications').checked = false;
                element.querySelector('#language-select').value = 'en';
                element.querySelector('#auto-save').checked = true;
                element.querySelector('#typing-indicator').checked = true;

                // Clear stored settings
                localStorage.removeItem('chatSettings');

                chatService.sendResponse({ content: '🔄 Settings reset to default values.' });
            });
        }
    };

    // Set the custom settings renderer after initialization
    chatService.initialize({
        ...chatService.getConfig(),
        settingsRenderer,
    });

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Add initial message about settings
    setTimeout(() => {
        // eslint-disable-next-line max-len
        chatService.sendResponse({ content: '👋 Welcome! This demo showcases the custom settings panel. Click the **Settings** button in the chat header to explore the configurable options.\n\nThe settings panel can be fully customized to match your application\'s needs.' });
    }, 500);

    // Add a button to programmatically open settings
    const demoButton = canvasElement.querySelector(`#docs-panel-${storyId}`);
    if (demoButton) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;';
        buttonContainer.innerHTML = `
            <h4 style="margin-bottom: 10px; color: #2c3e50;">Demo Controls</h4>
            <button id="open-settings-btn" style="
                background: #007acc;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">Open Settings Panel</button>
        `;

        const docsContent = demoButton.querySelector('.docs-content');
        if (docsContent) {
            docsContent.appendChild(buttonContainer);

            const openSettingsBtn = buttonContainer.querySelector('#open-settings-btn');
            if (openSettingsBtn) {
                openSettingsBtn.addEventListener('click', () => {
                    chatService.toggleSettings(true);
                });
            }
        }
    }
};
