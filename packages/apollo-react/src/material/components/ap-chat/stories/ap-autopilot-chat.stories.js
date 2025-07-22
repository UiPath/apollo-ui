import { argTypes } from './base.js';

// Import all story components
export {
    Default,
    BasicConversation,
    StreamingResponse,
    WithAttachments,
    WithHistory,
    EmbeddedMode,
    FullScreenMode,
    MinimalUI,
    WithCustomLabels,
    CustomWidgets,
    InteractiveFeatures,
    FeaturePlayground,
} from './index';

export default {
    title: 'Components/Autopilot Chat',
    component: 'ap-autopilot-chat',
    argTypes,
    parameters: {
        layout: 'fullscreen',
        docs: { disable: true },
    },
};
