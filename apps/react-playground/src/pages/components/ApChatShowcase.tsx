import {
	ApChat,
	AutopilotChatEvent,
	AutopilotChatMode,
	AutopilotChatRole,
	AutopilotChatService,
	type SupportedLocale,
} from "@uipath/apollo-react/material/components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "../../contexts/ThemeContext";
import {
	Button,
	ButtonGroup,
	ChatContainer,
	Checkbox,
	ControlPanel,
	FloatingChatContainer,
	InfoText,
	Input,
	PrimaryButton,
	Section,
	SectionTitle,
	Select,
	ShowcaseContainer,
	TextArea,
} from "./ApChatShowcase.styles";

export function ApChatShowcase() {
	const { theme, highContrast } = useTheme();
	const chatTheme = highContrast ? (`${theme}-hc` as const) : theme;
	const embeddedContainerRef = useRef<HTMLDivElement>(null);

	const [chatService, setChatService] = useState<AutopilotChatService | null>(
		null,
	);
	const [locale, setLocale] = useState<SupportedLocale>("en");
	const [chatMode, setChatMode] = useState<AutopilotChatMode>(
		AutopilotChatMode.SideBySide,
	);
	const [customMessage, setCustomMessage] = useState(
		"Hello, how can I help you today?",
	);
	const [errorMessage, setErrorMessage] = useState(
		"An error occurred. Please try again.",
	);
	const [streamingText, setStreamingText] = useState(
		"This is a streaming response that will appear word by word...",
	);
	const [loadingMessage, setLoadingMessage] = useState("Thinking...");
	const [waitForMore, setWaitForMore] = useState(false);
	const [autoScroll, setAutoScroll] = useState(true);
	const [isWaiting, setIsWaiting] = useState(false);
	const [isShowLoading, setIsShowLoading] = useState(false);

	// Feature toggles (true = feature enabled, false = feature disabled)
	const [features, setFeatures] = useState({
		history: true,
		settings: true,
		attachments: true,
		audio: true,
		htmlPreview: true,
		headerSeparator: false, // Disabled by default (like HTML)
		fullHeight: false, // Disabled by default
		resize: true,
		close: true,
		feedback: true,
		model: true,
		agentMode: true,
		sendOnClick: false,
		paginatedMessages: false,
		compactMode: false,
		customScrollTheme: false,
		copy: true, // Copy enabled by default
		attachmentsAsync: false,
	});
	const [selectedAgentMode, setSelectedAgentMode] = useState<string>("agent");
	const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

	// Custom settings renderer function
	const createSettingsRenderer = useCallback(
		() => (container: HTMLElement) => {
			// Create custom settings panel
			const settingsDiv = document.createElement("div");
			settingsDiv.style.padding = "24px";
			settingsDiv.style.color = "var(--color-foreground)";

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
						style="padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-foreground); width: 100px;" />
				</label>
				<label style="display: block;">
					<span style="display: block; margin-bottom: 4px;">Response Delay (ms)</span>
					<input type="number" id="responseDelay" value="0" min="0" max="5000" step="100"
						style="padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-foreground); width: 100px;" />
				</label>
			</div>

			<div style="display: flex; gap: 12px;">
				<button id="saveSettings" style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
					Save Settings
				</button>
				<button id="resetSettings" style="padding: 8px 16px; background: transparent; color: var(--color-foreground); border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer;">
					Reset to Defaults
				</button>
			</div>
		`;

			// Add event listeners
			const darkModeCheckbox = settingsDiv.querySelector(
				"#darkMode",
			) as HTMLInputElement;
			darkModeCheckbox?.addEventListener("change", (e) => {
				console.log("Dark mode:", (e.target as HTMLInputElement).checked);
			});

			const saveButton = settingsDiv.querySelector("#saveSettings");
			saveButton?.addEventListener("click", () => {
				console.log("Settings saved:", {
					darkMode: (settingsDiv.querySelector("#darkMode") as HTMLInputElement)
						.checked,
					compactMode: (
						settingsDiv.querySelector("#compactMode") as HTMLInputElement
					).checked,
					autoScroll: (
						settingsDiv.querySelector("#autoScroll") as HTMLInputElement
					).checked,
					soundEnabled: (
						settingsDiv.querySelector("#soundEnabled") as HTMLInputElement
					).checked,
					maxMessages: (
						settingsDiv.querySelector("#maxMessages") as HTMLInputElement
					).value,
					responseDelay: (
						settingsDiv.querySelector("#responseDelay") as HTMLInputElement
					).value,
				});
				alert("Settings saved successfully!");
			});

			const resetButton = settingsDiv.querySelector("#resetSettings");
			resetButton?.addEventListener("click", () => {
				(settingsDiv.querySelector("#darkMode") as HTMLInputElement).checked =
					false;
				(
					settingsDiv.querySelector("#compactMode") as HTMLInputElement
				).checked = true;
				(settingsDiv.querySelector("#autoScroll") as HTMLInputElement).checked =
					true;
				(
					settingsDiv.querySelector("#soundEnabled") as HTMLInputElement
				).checked = false;
				(settingsDiv.querySelector("#maxMessages") as HTMLInputElement).value =
					"100";
				(
					settingsDiv.querySelector("#responseDelay") as HTMLInputElement
				).value = "0";
				console.log("Settings reset to defaults");
			});

			container.appendChild(settingsDiv);
		},
		[],
	);

	useEffect(() => {
		// Initialize chat service
		const service = AutopilotChatService.Instantiate({
			instanceName: "showcase-chat",
			config: {
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
			},
		});
		setChatService(service);

		// Store unsubscribe functions for cleanup
		const unsubscribes: Array<() => void> = [];

		// Set up models
		service.setModels([
			{ id: "gpt-4", name: "GPT-4", description: "Most capable model" },
			{
				id: "gpt-3.5",
				name: "GPT-3.5 Turbo",
				description: "Fast and efficient",
			},
			{ id: "claude-3", name: "Claude 3", description: "Anthropic model" },
		]);
		service.setSelectedModel("gpt-4");

		// Set up agent modes
		service.setAgentModes([
			{
				id: "agent",
				name: "Agent",
				description: "AI-powered autonomous agent mode",
				icon: "smart_toy",
			},
			{
				id: "plan",
				name: "Plan",
				description: "Create and review execution plans",
				icon: "edit_note",
			},
			{
				id: "attended",
				name: "Attended",
				description: "Human assisted execution",
				icon: "play_arrow",
			},
		]);
		service.setAgentMode("agent");

		// Set up custom header actions - commented out due to icon issues
		service.setCustomHeaderActions([
			{
				id: "export",
				name: "Export Chat",
				icon: "download",
			},
			{
				id: "share",
				name: "Share",
				icon: "share",
			},
		]);

		// Set up suggestions
		service.setSuggestions([
			{ label: "What can you do?", prompt: "What can you do?" },
			{ label: "Show me an example", prompt: "Show me an example" },
			{ label: "Help me with code", prompt: "Help me with code" },
		]);

		// Set default loading messages
		service.setDefaultLoadingMessages([
			"Thinking...",
			"Processing your request...",
			"Analyzing...",
			"Working on it...",
		]);

		// Listen to events
		unsubscribes.push(
			service.on(AutopilotChatEvent.Request, (data: unknown) => {
				console.log("Request sent:", data);
			}),
		);

		unsubscribes.push(
			service.on(AutopilotChatEvent.ModeChange, (mode: unknown) => {
				console.log("Mode changed:", mode);
			}),
		);

		unsubscribes.push(
			service.on(AutopilotChatEvent.SetSelectedModel, (model: unknown) => {
				console.log("Model changed:", model);
				// biome-ignore lint/suspicious/noExplicitAny: Model type from event
				setSelectedModel((model as any).id || model);
			}),
		);

		unsubscribes.push(
			service.on(AutopilotChatEvent.SetSelectedAgentMode, (mode: unknown) => {
				console.log("Agent mode changed:", mode);
				// biome-ignore lint/suspicious/noExplicitAny: Agent mode type from event
				setSelectedAgentMode((mode as any).id);
			}),
		);

		unsubscribes.push(
			service.on(AutopilotChatEvent.ModeChange, (mode: unknown) => {
				console.log("Chat mode changed:", mode);
				setChatMode(mode as AutopilotChatMode);
			}),
		);

		// Additional event listeners
		unsubscribes.push(
			// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
			service.on("feedback" as any, (data: unknown) => {
				// biome-ignore lint/suspicious/noExplicitAny: Feedback data structure
				const { isPositive, message } = data as any;
				console.log(
					`Feedback: ${isPositive ? "Positive" : "Negative"}`,
					message,
				);
			}),
		);

		unsubscribes.push(
			// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
			service.on("copy" as any, (message: unknown) => {
				console.log("Copy event:", message);
				// Allow default copy behavior
			}),
		);

		unsubscribes.push(
			// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
			service.on("attachments" as any, (attachments: unknown) => {
				console.log("Attachments:", attachments);
			}),
		);

		unsubscribes.push(
			// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
			service.on("stopResponse" as any, () => {
				console.log("Stop response event");
			}),
		);

		// Listen for custom header action clicks
		unsubscribes.push(
			// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
			service.on("customHeaderActionClicked" as any, (action: unknown) => {
				// biome-ignore lint/suspicious/noExplicitAny: Action data structure
				const actionData = action as any;
				console.log("Custom header action clicked:", actionData);

				let responseContent = "";
				switch (actionData.id) {
					case "export-pdf":
						responseContent =
							"📄 **Exporting as PDF...**\n\nYour conversation has been exported to a PDF file.";
						break;
					case "export-docx":
						responseContent =
							"📝 **Exporting as DOCX...**\n\nYour conversation has been exported to a Word document.";
						break;
					case "export-json":
						responseContent =
							"💾 **Exporting as JSON...**\n\nYour conversation has been exported as JSON data.";
						break;
					case "export-txt":
						responseContent =
							"📋 **Exporting as Text...**\n\nYour conversation has been exported as plain text.";
						break;
					case "share":
						responseContent =
							"🔗 **Share Conversation**\n\nA shareable link has been generated:\n`https://example.com/chat/abc123`";
						break;
					case "translate-es":
						responseContent =
							"🇪🇸 **Traduciendo al español...**\n\nSu conversación ha sido traducida al español.";
						break;
					case "translate-fr":
						responseContent =
							"🇫🇷 **Traduction en français...**\n\nVotre conversation a été traduite en français.";
						break;
					case "translate-de":
						responseContent =
							"🇩🇪 **Übersetzung ins Deutsche...**\n\nIhre Unterhaltung wurde ins Deutsche übersetzt.";
						break;
					case "translate-ja":
						responseContent =
							"🇯🇵 **日本語に翻訳中...**\n\n会話が日本語に翻訳されました。";
						break;
					case "translate-zh":
						responseContent =
							"🇨🇳 **正在翻译成中文...**\n\n您的对话已翻译成中文。";
						break;
					case "print":
						responseContent =
							"🖨️ **Print Conversation**\n\nPreparing conversation for printing...";
						break;
					default:
						responseContent = `✅ Action triggered: **${actionData.name}** (ID: ${actionData.id})`;
				}

				service.sendResponse({
					content: responseContent,
					groupId: `custom-action-${actionData.id}`,
					created_at: "22-10-2025",
					widget: "apollo-markdown-renderer",
				});
			}),
		);

		return () => {
			// Cleanup - unsubscribe from all events
			for (const unsubscribe of unsubscribes) {
				unsubscribe();
			}
			service.close();
		};
	}, [
		createSettingsRenderer,
		features.attachments,
		features.audio,
		features.close,
		features.copy,
		features.feedback,
		features.fullHeight,
		features.headerSeparator,
		features.history,
		features.htmlPreview,
		features.resize,
		features.settings,
	]);

	// Update embedded container when in embedded mode
	useEffect(() => {
		if (
			chatService &&
			chatMode === AutopilotChatMode.Embedded &&
			embeddedContainerRef.current
		) {
			chatService.patchConfig({
				mode: AutopilotChatMode.Embedded,
				embeddedContainer: embeddedContainerRef.current,
			});
		}
	}, [chatService, chatMode]);

	// Update features when toggles change
	useEffect(() => {
		if (chatService) {
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
					embeddedContainerRef.current && {
						embeddedContainer: embeddedContainerRef.current,
					}),
			});

			// Re-set models and agent modes after initialization (or clear if disabled)
			if (features.model) {
				chatService.setModels([
					{ id: "gpt-4", name: "GPT-4", description: "Most capable model" },
					{
						id: "gpt-3.5",
						name: "GPT-3.5 Turbo",
						description: "Fast and efficient",
					},
					{ id: "claude-3", name: "Claude 3", description: "Anthropic model" },
				]);
				chatService.setSelectedModel(selectedModel);
			} else {
				chatService.setModels([]);
			}

			if (features.agentMode) {
				chatService.setAgentModes([
					{
						id: "agent",
						name: "Agent",
						description: "AI-powered autonomous agent mode",
						icon: "smart_toy",
					},
					{
						id: "plan",
						name: "Plan",
						description: "Create and review execution plans",
						icon: "edit_note",
					},
					{
						id: "attended",
						name: "Attended",
						description: "Human assisted execution",
						icon: "play_arrow",
					},
				]);
				chatService.setAgentMode(selectedAgentMode);
			} else {
				chatService.setAgentModes([]);
			}

			// Update other config settings
			chatService.patchConfig({
				paginatedMessages: features.paginatedMessages,
				spacing: {
					compactMode: features.compactMode,
				},
				theming: {
					scrollBar: features.customScrollTheme
						? {
								scrollThumbColor: "#000000",
								scrollSize: "16px",
								scrollHoverColor: "#888888",
								scrollBorderRadius: "8px",
							}
						: undefined,
				},
			});

			// Handle attachments async
			if (features.attachmentsAsync) {
				// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
				chatService.on("setAttachments" as any, (attachments: unknown) => {
					// biome-ignore lint/suspicious/noExplicitAny: Attachments data structure
					const attachmentsData = attachments as any;
					chatService.setAttachmentsLoading([
						// biome-ignore lint/suspicious/noExplicitAny: Attachment object structure
						...attachmentsData.added.map((attachment: any) => ({
							...attachment,
							loading: true,
						})),
					]);

					setTimeout(() => {
						chatService.setAttachmentsLoading([
							// biome-ignore lint/suspicious/noExplicitAny: Attachment object structure
							...attachmentsData.added.map((attachment: any) => ({
								...attachment,
								loading: false,
							})),
						]);
					}, 2000);
				});
			} else {
				chatService.setAttachmentsLoading([]);
			}
		}
	}, [
		features,
		chatService,
		selectedModel,
		selectedAgentMode,
		createSettingsRenderer,
		chatMode,
	]);

	// Chat mode controls
	const openChat = () => chatService?.open();
	const closeChat = () => chatService?.close();
	const setFullScreen = () => {
		chatService?.setChatMode(AutopilotChatMode.FullScreen);
		setChatMode(AutopilotChatMode.FullScreen);
	};
	const setSideBySide = () => {
		chatService?.setChatMode(AutopilotChatMode.SideBySide);
		setChatMode(AutopilotChatMode.SideBySide);
	};
	const setEmbedded = () => {
		setChatMode(AutopilotChatMode.Embedded);
		chatService?.setChatMode(AutopilotChatMode.Embedded);
	};

	// Message controls
	const sendSimpleRequest = () => {
		chatService?.sendRequest({
			content: customMessage,
		});
	};

	const sendSimpleResponse = () => {
		chatService?.sendResponse({
			content: customMessage,
			created_at: "22-10-2025",
			widget: "apollo-markdown-renderer",
			shouldWaitForMoreMessages: waitForMore,
		});
	};

	const sendResponseWithActions = () => {
		chatService?.sendResponse({
			content: "Here is a response with custom actions. Try the buttons below!",
			created_at: "22-10-2025",
			widget: "apollo-markdown-renderer",
			actions: [
				{
					name: "copy-action",
					label: "Copy to Clipboard",
					icon: "content_copy",
					eventName: "copy-custom",
				},
				{
					name: "regenerate-action",
					label: "Regenerate",
					icon: "refresh",
					eventName: "regenerate-custom",
				},
			],
		});

		// Listen for the custom events
		// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
		chatService?.on("copy-custom" as any, () => {
			navigator.clipboard.writeText("Response copied!");
			alert("Copied to clipboard!");
		});

		// biome-ignore lint/suspicious/noExplicitAny: Event not in enum
		chatService?.on("regenerate-custom" as any, () => {
			alert("Regenerating response...");
		});
	};

	const sendResponseWithCitations = () => {
		chatService?.sendResponse({
			content:
				"According to research, the sky is blue due to Rayleigh scattering. See references below for more information.",
			widget: "default",
			contentParts: [
				{
					text: "According to research, the sky is blue due to Rayleigh scattering. ",
					citations: [
						{
							id: 1,
							title: "Why is the Sky Blue?",
							url: "https://example.com/sky",
						},
					],
				},
				{
					text: "See references below for more information.",
					citations: [
						{
							id: 2,
							title: "Atmospheric Science",
							url: "https://example.com/atmosphere",
						},
					],
				},
			],
			// biome-ignore lint/suspicious/noExplicitAny: contentParts and citations not in public type definition
		} as any);
	};

	const sendStreamingResponse = () => {
		// Use fakeStream for simpler demo streaming
		chatService?.sendResponse({
			content: streamingText,
			fakeStream: true,
			shouldWaitForMoreMessages: waitForMore,
			// biome-ignore lint/suspicious/noExplicitAny: fakeStream not in public type definition
		} as any);
	};

	const sendCodeBlock = () => {
		const codeContent = `\`\`\`typescript
// This is a long comment line that should wrap properly when displayed in the code block to test the wrapping functionality
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

function processUserData(user: UserProfile, additionalMetadata: Record<string, unknown>): string {
  const fullName = \`\${user.firstName} \${user.lastName}\`;
  const metadataString = JSON.stringify(additionalMetadata, null, 2);

  return \`User: \${fullName} (\${user.email}) - Created: \${user.createdAt.toISOString()} - Metadata: \${metadataString}\`;
}

const exampleUser: UserProfile = {
  id: 12345,
  username: 'john_doe_with_a_very_long_username_that_should_test_wrapping',
  email: 'john.doe.with.a.very.long.email.address@example-domain-name.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
  preferences: { theme: 'dark', language: 'en-US', notifications: true }
};

console.log(processUserData(exampleUser, { source: 'web', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }));
\`\`\``;

		chatService?.sendResponse({
			content: `Here's a TypeScript example with long lines to test wrapping:\n\n${codeContent}`,
			widget: "default",
			// biome-ignore lint/suspicious/noExplicitAny: widget property not properly typed
		} as any);
	};

	const sendHTMLPreview = () => {
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
			widget: "default",
			// biome-ignore lint/suspicious/noExplicitAny: widget property not properly typed
		} as any);
	};

	// Loading and error states
	const showLoading = () => {
		chatService?.setLoadingMessage(loadingMessage);
	};

	const hideLoading = () => {
		chatService?.setLoadingMessage("");
	};

	const showError = () => {
		chatService?.setError(errorMessage);
	};

	const showWarning = () => {
		chatService?.setError("This is a warning message.");
	};

	const clearErrors = () => {
		chatService?.clearError();
	};

	// History controls
	const toggleHistory = () => {
		chatService?.toggleHistory();
	};

	const addHistoryItems = () => {
		chatService?.setHistory([
			{
				id: "1",
				name: "Previous Conversation 1",
				timestamp: new Date(Date.now() - 86400000).toISOString(),
			},
			{
				id: "2",
				name: "Previous Conversation 2",
				timestamp: new Date(Date.now() - 172800000).toISOString(),
			},
			{
				id: "3",
				name: "Previous Conversation 3",
				timestamp: new Date(Date.now() - 259200000).toISOString(),
			},
		]);
	};

	// Utility
	const clearChat = () => {
		chatService?.newChat();
	};

	const toggleFeature = (feature: keyof typeof features) => {
		setFeatures((prev) => ({
			...prev,
			[feature]: !prev[feature],
		}));
	};

	// Additional controls
	const setPrompt = () => {
		chatService?.setPrompt("I need something to be done");
	};

	const resetPrompt = () => {
		chatService?.setPrompt("");
	};

	const stopResponse = () => {
		chatService?.stopResponse();
	};

	const toggleAutoScroll = () => {
		const newValue = !autoScroll;
		setAutoScroll(newValue);
		chatService?.toggleAutoScroll(newValue);
	};

	const setAllowedAttachments = () => {
		chatService?.setAllowedAttachments({
			types: {
				"text/csv": [".csv"],
			},
			maxSize: 1024 * 1024,
			multiple: false,
		});
		alert("Allowed attachments set to: CSV files only, max 1MB");
	};

	const setFirstRunExperience = () => {
		chatService?.setFirstRunExperience({
			title: "Welcome to UiPath Autopilot",
			description:
				"I'm here to help you build, understand, and troubleshoot your automation projects.",
			suggestions: [
				{
					label: "New process",
					prompt:
						"Can you provide a detailed step-by-step guide on how to create a new automation process?",
				},
				{
					label: "Debug workflow",
					prompt:
						"I'm having trouble with my workflow execution. Can you explain debugging techniques?",
				},
				{
					label: "Studio updates",
					prompt: "What are the latest features in UiPath Studio?",
				},
			],
		});
	};

	const setConversation = () => {
		chatService?.setConversation([
			{
				id: "1",
				role: AutopilotChatRole.User,
				content: "How do I create a workflow that extracts data from invoices?",
				created_at: "22-10-2022",
				widget: "",
			},
			{
				id: "2",
				role: AutopilotChatRole.Assistant,
				content:
					'To extract data from invoices, you can use UiPath Document Understanding. Here\'s a step-by-step approach:\n\n1. Install the Document Understanding package\n2. Create a new workflow and add the "Digitize Document" activity\n3. Configure it to use ML skills\n4. Use the "Data Extraction" activity\n5. Validate the extracted data',
				created_at: "23-10-2022",
				widget: "",
			},
		]);
	};

	const setSuggestions = () => {
		chatService?.setSuggestions(
			[
				{ label: "What can you do?", prompt: "What can you do?" },
				{ label: "Show me an example", prompt: "Show me an example" },
				{ label: "Help me with code", prompt: "Help me with code" },
			],
			true,
		);
	};

	const sendToolCall = () => {
		chatService?.sendResponse({
			content: "Tool call response",
			widget: "apollo-agents-tool-call",
			meta: {
				input: {
					provider: "GoogleCustomSearch",
					query: "most interesting scientific fact discovered recently 2025",
					num: 5,
				},
				output: {
					results: [
						{
							snippet: "Breaking science news and articles...",
							title: "ScienceDaily: Latest Research News",
							url: "https://www.sciencedaily.com/",
						},
					],
				},
				isError: false,
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
				toolName: "Web_Search",
			},
			// biome-ignore lint/suspicious/noExplicitAny: meta property not in public type definition
		} as any);
	};

	const sendResponseDisabledActions = () => {
		chatService?.sendResponse({
			content: "Message with no actions",
			disableActions: true,
			// biome-ignore lint/suspicious/noExplicitAny: disableActions not in public type definition
		} as any);
	};

	const setPreHook = () => {
		const actions = [
			"new-chat",
			"toggle-history",
			"toggle-chat",
			"close-chat",
			"feedback",
		];
		actions.forEach((action) => {
			// biome-ignore lint/suspicious/noExplicitAny: setPreHook action parameter not fully typed
			chatService?.setPreHook(action as any, async () => {
				return confirm(`${action} pre hook. Continue?`);
			});
		});
		alert("Pre-hooks set for all actions");
	};

	// Custom Header Actions
	const setCustomHeaderActions = () => {
		chatService?.setCustomHeaderActions([
			{
				id: "export",
				name: "Export",
				icon: "download",
				description: "Export conversation in various formats",
				children: [
					{
						id: "export-pdf",
						name: "Export as PDF",
						icon: "picture_as_pdf",
						description: "Download conversation as PDF file",
					},
					{
						id: "export-docx",
						name: "Export as DOCX",
						icon: "description",
						description: "Download conversation as Word document",
					},
					{
						id: "export-json",
						name: "Export as JSON",
						icon: "data_object",
						description: "Download conversation as JSON file",
					},
					{
						id: "export-txt",
						name: "Export as Text",
						icon: "text_snippet",
						description: "Download conversation as plain text",
					},
				],
			},
			{
				id: "share",
				name: "Share Conversation",
				icon: "share",
				description: "Share this conversation with others",
			},
			{
				id: "translate",
				name: "Translate",
				icon: "translate",
				description: "Translate conversation to different languages",
				children: [
					{
						id: "translate-es",
						name: "Spanish",
						icon: "language",
						description: "Translate to Spanish",
					},
					{
						id: "translate-fr",
						name: "French",
						icon: "language",
						description: "Translate to French",
					},
					{
						id: "translate-de",
						name: "German",
						icon: "language",
						description: "Translate to German",
					},
					{
						id: "translate-ja",
						name: "Japanese",
						icon: "language",
						description: "Translate to Japanese",
					},
					{
						id: "translate-zh",
						name: "Chinese",
						icon: "language",
						description: "Translate to Chinese",
					},
				],
			},
			{
				id: "print",
				name: "Print",
				icon: "print",
				description: "Print conversation",
			},
			{
				id: "advanced",
				name: "Advanced Settings",
				icon: "tune",
				description: "Advanced configuration options",
				disabled: true,
			},
			// biome-ignore lint/suspicious/noExplicitAny: Custom header actions type not fully defined
		] as any);
		console.log("Custom header actions set");
	};

	const clearCustomHeaderActions = () => {
		chatService?.setCustomHeaderActions([]);
		console.log("Custom header actions cleared");
	};

	// Stream with Citations
	const streamWithCitations = () => {
		// Generate a unique message ID for this streaming response
		const messageId = `streaming-citations-${Date.now()}`;
		let streamIndex = 0;

		const streamingParts = [
			{ index: 0, text: "Based on the search results" },
			{ index: 0, text: ", I'll" },
			{ index: 0, text: " create a comprehensive" },
			{ index: 0, text: " summary about UiPath with" },
			{ index: 0, text: " citations:\n\n##" },
			{ index: 0, text: " Company Background" },
			{ index: 0, text: "\n- " },
			{ index: 1, text: "**UiPath Inc**" },
			{ index: 1, text: ". is a global" },
			{ index: 1, text: " software company that was" },
			{ index: 1, text: " founded in " },
			{ index: 1, text: "_Bucharest, Romania_" },
			{ index: 1, text: ", by" },
			{ index: 1, text: " **Daniel Dines**" },
			{
				index: 1,
				text: "",
				citation: {
					id: 1,
					title: "UiPath - Wikipedia",
					url: "https://en.wikipedia.org/wiki/UiPath",
				},
			},
			{ index: 2, text: ". " },
			{ index: 3, text: "The" },
			{ index: 3, text: " company starte" },
			{ index: 3, text: "d its journey" },
			{ index: 3, text: " in 2005" },
			{ index: 3, text: " and has" },
			{ index: 3, text: " grown to become a leading" },
			{ index: 3, text: " enterprise automation software ven" },
			{
				index: 3,
				text: "dor",
				citation: {
					id: 1,
					title: "UiPath - Wikipedia",
					url: "https://en.wikipedia.org/wiki/UiPath",
				},
			},
			{
				index: 3,
				text: "",
				citation: {
					id: 2,
					title: "UiPath, Inc. (PATH)",
					url: "https://ir.uipath.com/",
				},
			},
			{ index: 4, text: ". \n\n## Core" },
			{ index: 4, text: " Business" },
			{ index: 4, text: "\nU" },
			{ index: 4, text: "iPath special" },
			{ index: 4, text: "izes in several" },
			{ index: 4, text: " key areas:\n\n1" },
			{ index: 4, text: ". **Rob" },
			{ index: 4, text: "otic Process Automation" },
			{ index: 4, text: ":**" },
			{ index: 4, text: "\n" },
			{ index: 5, text: "R" },
			{ index: 5, text: "PA has" },
			{ index: 5, text: " revolutionized how work" },
			{ index: 5, text: " gets done globally" },
			{ index: 5, text: " by eliminating time" },
			{ index: 5, text: "-consuming, repet" },
			{ index: 5, text: "itive tasks from employees" },
			{ index: 5, text: "' worklo" },
			{
				index: 5,
				text: "ads",
				citation: {
					id: 3,
					title: "Discovery Phase Guide",
					download_url:
						"https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf",
					page_number: 2,
				},
			},
			{ index: 6, text: "." },
			{ index: 6, text: "\n\n2. **" },
			{ index: 6, text: "Business Automation Platform**" },
			{ index: 6, text: "\n" },
			{ index: 7, text: "The platform" },
			{ index: 7, text: " offers en" },
			{ index: 7, text: "d-to-en" },
			{ index: 7, text: "d process transformation" },
			{ index: 7, text: " capabilities on" },
			{ index: 7, text: " a single platform," },
			{ index: 7, text: " featuring fully" },
			{ index: 7, text: " governed agentic" },
			{ index: 7, text: " automation that integ" },
			{ index: 7, text: "rates with existing systems" },
			{
				index: 7,
				text: "",
				citation: {
					id: 4,
					title: "UiPath Business Automation Platform | UiPath",
					url: "https://www.uipath.com/product",
				},
			},
		];

		const streamChunk = () => {
			if (streamIndex >= streamingParts.length) {
				return;
			}

			const chunk = streamingParts[streamIndex];
			if (!chunk) return;

			// Use the same message ID for all chunks
			// Set done: true only for the last chunk
			chatService?.sendResponse({
				id: messageId,
				contentPartChunk: {
					index: chunk.index,
					text: chunk.text,
					...(chunk.citation && { citation: chunk.citation }),
				},
				stream: true,
				done: streamIndex === streamingParts.length - 1,
				// biome-ignore lint/suspicious/noExplicitAny: contentPartChunk not in public type definition
			} as any);

			streamIndex++;

			// Continue streaming if there are more chunks
			if (streamIndex < streamingParts.length) {
				setTimeout(streamChunk, 100);
			}
		};

		streamChunk();
	};

	// Agent Mode selection
	const handleAgentModeChange = (mode: string) => {
		setSelectedAgentMode(mode);
		chatService?.setAgentMode(mode);
	};

	// Model selection
	const handleModelChange = (modelId: string) => {
		setSelectedModel(modelId);
		chatService?.setSelectedModel(modelId);
	};

	return (
		<ShowcaseContainer>
			<ControlPanel
				style={{
					display: chatMode === AutopilotChatMode.FullScreen ? "none" : "flex",
				}}
			>
				<h2 style={{ margin: "0 0 24px 0", color: "var(--color-primary)" }}>
					ApChat Showcase
				</h2>

				<Section>
					<SectionTitle>Locale</SectionTitle>
					<Select
						value={locale}
						onChange={(e) => setLocale(e.target.value as SupportedLocale)}
					>
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
					</Select>
				</Section>

				<Section>
					<SectionTitle>Chat Mode Controls</SectionTitle>
					<ButtonGroup>
						<PrimaryButton onClick={openChat}>Open Chat</PrimaryButton>
						<Button onClick={closeChat}>Close Chat</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={setSideBySide}>Side by Side</Button>
						<Button onClick={setFullScreen}>Full Screen</Button>
						<Button onClick={setEmbedded}>Embedded</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={toggleAutoScroll}>Toggle Auto Scroll</Button>
						<Button onClick={clearChat}>Clear Chat</Button>
					</ButtonGroup>
				</Section>

				<Section>
					<SectionTitle>Chat Setup</SectionTitle>
					<ButtonGroup>
						<Button onClick={setAllowedAttachments}>
							Set Allowed Attachments
						</Button>
						<Button onClick={setPreHook}>Set Pre Hook</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={setFirstRunExperience}>
							Set First Run Experience
						</Button>
					</ButtonGroup>
				</Section>

				<Section>
					<SectionTitle>Custom Header Actions</SectionTitle>
					<ButtonGroup>
						<Button onClick={setCustomHeaderActions}>
							Set Custom Header Actions
						</Button>
						<Button onClick={clearCustomHeaderActions}>
							Clear Custom Header Actions
						</Button>
					</ButtonGroup>
				</Section>

				<Section>
					<SectionTitle>Model Selection</SectionTitle>
					<Select
						value={selectedModel}
						onChange={(e) => handleModelChange(e.target.value)}
					>
						<option value="gpt-4">GPT-4</option>
						<option value="gpt-3.5">GPT-3.5 Turbo</option>
						<option value="claude-3">Claude 3</option>
					</Select>
				</Section>

				<Section>
					<SectionTitle>Agent Mode</SectionTitle>
					<Select
						value={selectedAgentMode}
						onChange={(e) => handleAgentModeChange(e.target.value)}
					>
						<option value="agent">Agent</option>
						<option value="plan">Plan</option>
						<option value="attended">Attended</option>
					</Select>
				</Section>

				<Section>
					<SectionTitle>Message Controls</SectionTitle>
					<ButtonGroup>
						<Button onClick={setPrompt}>Set Prompt</Button>
						<Button onClick={resetPrompt}>Reset Prompt</Button>
					</ButtonGroup>
					<Input
						placeholder="Custom message"
						value={customMessage}
						onChange={(e) => setCustomMessage(e.target.value)}
					/>
					<ButtonGroup>
						<Button onClick={sendSimpleRequest}>Send Request</Button>
						<Button onClick={sendSimpleResponse}>Send Response</Button>
						<Button onClick={stopResponse}>Stop Response</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={sendResponseWithActions}>With Actions</Button>
						<Button onClick={sendResponseWithCitations}>With Citations</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={sendCodeBlock}>Code Block</Button>
						<Button onClick={sendHTMLPreview}>HTML Preview</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={sendToolCall}>Send Tool Call</Button>
						<Button onClick={sendResponseDisabledActions}>
							Disabled Actions
						</Button>
					</ButtonGroup>
					<ButtonGroup>
						<Button onClick={setConversation}>Set Conversation</Button>
						<Button onClick={setSuggestions}>Set Suggestions</Button>
					</ButtonGroup>
					<Checkbox>
						<input
							type="checkbox"
							checked={waitForMore}
							onChange={() => setWaitForMore(!waitForMore)}
						/>
						Wait For More Messages
					</Checkbox>
				</Section>

				<Section>
					<SectionTitle>Streaming</SectionTitle>
					<TextArea
						placeholder="Text to stream"
						value={streamingText}
						onChange={(e) => setStreamingText(e.target.value)}
					/>
					<ButtonGroup>
						<Button onClick={sendStreamingResponse}>Stream Response</Button>
						<Button onClick={streamWithCitations}>Stream With Citations</Button>
					</ButtonGroup>
					<InfoText>Streams the text word by word</InfoText>
				</Section>

				<Section>
					<SectionTitle>Loading & Error States</SectionTitle>
					<Input
						placeholder="Loading message"
						value={loadingMessage}
						onChange={(e) => setLoadingMessage(e.target.value)}
					/>
					<ButtonGroup>
						<Button onClick={showLoading}>Show Loading</Button>
						<Button onClick={hideLoading}>Hide Loading</Button>
					</ButtonGroup>
					<Input
						placeholder="Error message"
						value={errorMessage}
						onChange={(e) => setErrorMessage(e.target.value)}
					/>
					<ButtonGroup>
						<Button onClick={showError}>Show Error</Button>
						<Button onClick={showWarning}>Show Warning</Button>
						<Button onClick={clearErrors}>Clear Errors</Button>
					</ButtonGroup>
				</Section>

				<Section>
					<SectionTitle>History</SectionTitle>
					<ButtonGroup>
						<Button onClick={addHistoryItems}>Add History Items</Button>
						<Button onClick={toggleHistory}>Toggle History Panel</Button>
					</ButtonGroup>
				</Section>

				<Section>
					<SectionTitle>Feature Toggles</SectionTitle>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.history}
							onChange={() => toggleFeature("history")}
						/>
						History
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.settings}
							onChange={() => toggleFeature("settings")}
						/>
						Settings
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.attachments}
							onChange={() => toggleFeature("attachments")}
						/>
						Attachments
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.audio}
							onChange={() => toggleFeature("audio")}
						/>
						Audio
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.htmlPreview}
							onChange={() => toggleFeature("htmlPreview")}
						/>
						HTML Preview
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.headerSeparator}
							onChange={() => toggleFeature("headerSeparator")}
						/>
						Header Separator
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.fullHeight}
							onChange={() => toggleFeature("fullHeight")}
						/>
						Full Height
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.resize}
							onChange={() => toggleFeature("resize")}
						/>
						Resize
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.close}
							onChange={() => toggleFeature("close")}
						/>
						Close
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.feedback}
							onChange={() => toggleFeature("feedback")}
						/>
						Feedback
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.model}
							onChange={() => toggleFeature("model")}
						/>
						Model
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.agentMode}
							onChange={() => toggleFeature("agentMode")}
						/>
						Agent Mode
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.sendOnClick}
							onChange={() => toggleFeature("sendOnClick")}
						/>
						Send On Click
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.paginatedMessages}
							onChange={() => toggleFeature("paginatedMessages")}
						/>
						Paginated Messages
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.compactMode}
							onChange={() => toggleFeature("compactMode")}
						/>
						Compact Mode
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.customScrollTheme}
							onChange={() => toggleFeature("customScrollTheme")}
						/>
						Custom Scroll Theme
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.copy}
							onChange={() => toggleFeature("copy")}
						/>
						Copy
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={features.attachmentsAsync}
							onChange={() => toggleFeature("attachmentsAsync")}
						/>
						Attachments Async
					</Checkbox>
				</Section>

				<Section>
					<SectionTitle>State Controls</SectionTitle>
					<Checkbox>
						<input
							type="checkbox"
							checked={isWaiting}
							onChange={() => {
								setIsWaiting(!isWaiting);
								chatService?.setWaiting(!isWaiting);
							}}
						/>
						Set Waiting
					</Checkbox>
					<Checkbox>
						<input
							type="checkbox"
							checked={isShowLoading}
							onChange={() => {
								setIsShowLoading(!isShowLoading);
								chatService?.setShowLoading(!isShowLoading);
							}}
						/>
						Set Show Loading
					</Checkbox>
				</Section>
			</ControlPanel>

			{/* Chat component - always render once */}
			{chatService && (
				<ChatContainer>
					<ApChat
						chatServiceInstance={chatService}
						locale={locale}
						theme={chatTheme}
					/>
				</ChatContainer>
			)}

			{/* Embedded mode: Container always rendered but hidden when not in embedded mode */}
			<FloatingChatContainer
				ref={embeddedContainerRef}
				style={{
					background: "var(--color-background)",
					display: chatMode === AutopilotChatMode.Embedded ? "block" : "none",
				}}
			/>
		</ShowcaseContainer>
	);
}
