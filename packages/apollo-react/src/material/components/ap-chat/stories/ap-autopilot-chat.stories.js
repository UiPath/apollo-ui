import { argTypes } from './base.js';
// Import all story components
import {
    BasicConversation as BasicConversationStory,
    CustomWidgets as CustomWidgetsStory,
    Default as DefaultStory,
    EmbeddedMode as EmbeddedModeStory,
    ErrorHandling as ErrorHandlingStory,
    FeaturePlayground as FeaturePlaygroundStory,
    FirstRunExperience as FirstRunExperienceStory,
    FullScreenMode as FullScreenModeStory,
    InteractiveFeatures as InteractiveFeaturesStory,
    MinimalUI as MinimalUIStory,
    Settings as SettingsStory,
    StreamingResponse as StreamingResponseStory,
    StreamingWithCitations as StreamingWithCitationsStory,
    WithAttachments as WithAttachmentsStory,
    WithCitations as WithCitationsStory,
    WithCustomLabels as WithCustomLabelsStory,
    WithHistory as WithHistoryStory,
} from './index';

// Export with proper display names
export const Default = DefaultStory;
export const BasicConversation = BasicConversationStory;
export const StreamingResponse = StreamingResponseStory;
export const WithAttachments = WithAttachmentsStory;
export const WithHistory = WithHistoryStory;
export const EmbeddedMode = EmbeddedModeStory;
export const FullScreenMode = FullScreenModeStory;
export const MinimalUI = MinimalUIStory;
export const WithCustomLabels = WithCustomLabelsStory;
export const CustomWidgets = CustomWidgetsStory;
export const InteractiveFeatures = InteractiveFeaturesStory;
export const FeaturePlayground = FeaturePlaygroundStory;
export const Settings = SettingsStory;
export const ErrorHandling = ErrorHandlingStory;
export const FirstRunExperience = FirstRunExperienceStory;
export const WithCitations = WithCitationsStory;
export const StreamingWithCitations = StreamingWithCitationsStory;

// Set display names
Default.storyName = 'Default';
BasicConversation.storyName = 'Basic Conversation';
StreamingResponse.storyName = 'Streaming Response';
WithAttachments.storyName = 'With Attachments';
WithHistory.storyName = 'With History';
EmbeddedMode.storyName = 'Embedded Mode';
FullScreenMode.storyName = 'Full Screen Mode';
MinimalUI.storyName = 'Minimal UI';
WithCustomLabels.storyName = 'With Custom Labels';
CustomWidgets.storyName = 'Custom Widgets';
InteractiveFeatures.storyName = 'Interactive Features';
FeaturePlayground.storyName = 'Feature Playground';
Settings.storyName = 'Settings';
ErrorHandling.storyName = 'Error Handling';
FirstRunExperience.storyName = 'First Run Experience';
WithCitations.storyName = 'With Citations';
StreamingWithCitations.storyName = 'Streaming With Citations';

export default {
    title: 'Components/Autopilot Chat',
    component: 'ap-autopilot-chat',
    argTypes,
    parameters: {
        layout: 'fullscreen',
        docs: { disable: true },
    },
};
