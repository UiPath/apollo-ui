import { prettyPrint } from '../../../stories/helper';
import { getStoryDocs } from './helpers';

// Base template used by all stories
export const template = (args, storyId = 'default') => {
    const containerId = args.mode === 'embedded' ? 'embedded-chat-container' : '';
    const docs = getStoryDocs(storyId);

    const content = prettyPrint(`
        <div id="story-container-${storyId}" style="display: flex; width: 100%; height: 100vh;">
            <!-- Documentation Panel -->
            <div id="docs-panel-${storyId}" style="
                ${args.mode === 'full-screen' ? 'display: none;' : ''}
                flex: 1; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                padding: 30px;
                margin: 20px;
                margin-right: 10px;
                overflow-y: auto;
                max-height: calc(100vh - 40px);
            ">
                <div class="story-docs" style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                ">
                    ${docs.split('\n').map(line => {
        if (line.startsWith('# ')) {
            return `<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
            return `<h2 style="color: #34495e; margin-top: 20px; margin-bottom: 8px;">${line.substring(3)}</h2>`;
        } else if (line.startsWith('**') && line.endsWith(':**')) {
            return `<h3 style="color: #7f8c8d; margin-top: 15px; margin-bottom: 5px;">${line.substring(2, line.length - 3)}</h3>`;
        } else if (line.startsWith('- ')) {
            return `<li style="margin-bottom: 3px;">${line.substring(2)}</li>`;
        } else if (line.trim() === '') {
            return '';
        }
        return `<p style="margin-bottom: 8px;">${line}</p>`;

    })
        .join('')}
                </div>
                
                ${storyId === 'interactive-features' ? `
                <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3498db;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Try the Interactive Features</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        <ap-theme-provider theme="light">
                            <ap-button id="set-loading-demo" label="Show Loading Messages" size="small"></ap-button>
                        </ap-theme-provider>
                        <ap-theme-provider theme="light">
                            <ap-button id="set-suggestions-demo" label="Set Suggestions" size="small"></ap-button>
                        </ap-theme-provider>
                        <ap-theme-provider theme="light">
                            <ap-button id="send-actions-demo" label="Send Custom Actions" size="small"></ap-button>
                        </ap-theme-provider>
                    </div>
                </div>
                ` : args.mode === 'embedded' ? `
                <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3498db;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Interactive Demo Controls</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <ap-theme-provider theme="light">
                            <ap-button id="send-demo" label="Send Demo Message"></ap-button>
                        </ap-theme-provider>
                        <ap-theme-provider theme="light">
                            <ap-button id="clear-chat" label="Clear Chat"></ap-button>
                        </ap-theme-provider>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #34495e;">Integration Code</h4>
                        <pre style="
                            margin: 0; 
                            padding: 10px; 
                            background: #2c3e50; 
                            color: #ecf0f1; 
                            border-radius: 4px; 
                            overflow-x: auto;
                            font-size: 12px;
                        ">const container = document.getElementById('chat-container');
chatService.open({
mode: 'embedded',
embeddedContainer: container
});</pre>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Chat Panel -->
            <div id="chat-panel-${storyId}" style="
                ${args.mode === 'full-screen' ? 'width: 100%; margin: 0;' : 'justify-self: flex-end; margin: 20px; margin-left: 10px; min-width: 400px;'}
            ">
                ${args.mode === 'embedded' ? `
                <!-- Floating Chat Container -->
                <div id="${containerId}" style="
                    width: 100%;
                    height: calc(100vh - 40px);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 5px 20px rgba(0,0,0,0.15);
                    background: white;
                "></div>
                ` : `
                <ap-autopilot-chat id="chat-${storyId}" style="
                    width: 100%;
                    height: ${args.mode === 'full-screen' ? '100vh' : 'calc(100vh - 40px)'};
                    ${args.mode === 'full-screen' ? '' : 'border-radius: 12px; box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 5px 20px rgba(0,0,0,0.15);'}
                    overflow: hidden;
                "></ap-autopilot-chat>
                `}
            </div>
        </div>
    `);

    return content;
};
