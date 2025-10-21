import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const TreeRenderer = (args) => template(args, 'tree-renderer');

TreeRenderer.args = {
    ...defaultArgs,
    showFirstRun: false,
};

TreeRenderer.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'tree-renderer';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    chatService.newChat();
    setTimeout(() => {
        chatService.sendResponse(
            {
                content: 'Tree renderer response',
                widget: 'apollo-chat-tree-renderer',
                toCopy: 'Tree renderer response',
                meta: {
                    span: {
                        key: 'root',
                        name: 'Agent Execution Flow',
                        data: {
                            id: 'agent-1',
                            titleColor: "#FFA500",
                            parentId: null,
                            name: 'Agent Execution Flow',
                            startTime: new Date('2024-04-04T12:00:00Z'),
                            endTime: new Date('2024-04-04T12:02:00Z'),
                            status: 'ok',
                            customIcon: 'robot',
                            additionalInfo: "5s",
                            attributes: {
                                type: 'agentRun',
                                description: 'Main agent execution workflow',
                                systemPrompt: 'Executing agent workflow',
                                userPrompt: 'Perform multiple operations with different tools',
                                inputSchema: {},
                                input: {}
                            },
                        },
                        children: [
                            {
                                key: 'process-1',
                                name: 'Tool Call 1',
                                data: {
                                    id: 'process-1',
                                    parentId: 'agent-1',
                                    name: 'Tool Call 1',
                                    icon: "code", // mui icon
                                    startTime: new Date('2024-04-04T12:00:10Z'),
                                    endTime: new Date('2024-04-04T12:00:30Z'),
                                    status: 'ok',
                                    additionalInfo: '20s',
                                    attributes: {
                                        type: 'toolCall',
                                        description: 'First tool execution',
                                        toolName: 'Web_Search',
                                        arguments: {
                                            provider: 'GoogleCustomSearch',
                                            query: 'most interesting scientific fact discovered recently 2025',
                                            num: 5
                                        }
                                    },
                                },
                                children: [
                                    {
                                        key: 'sub-tool-1',
                                        name: 'Pre-Process Run',
                                        data: {
                                            id: 'sub-tool-1',
                                            parentId: 'process-1',
                                            name: 'Pre-Process Run',
                                            startTime: new Date('2024-04-04T12:00:15Z'),
                                            endTime: new Date('2024-04-04T12:00:25Z'),
                                            status: 'ok',
                                            customIcon: "waffle",
                                            additionalInfo: '10s',
                                            attributes: {
                                                type: 'ProcessRun',
                                                description: 'Data transformation step'
                                            }
                                        }
                                    },
                                    {
                                        key: 'sub-tool-2',
                                        name: 'Process Tool',
                                        data: {
                                            id: 'sub-tool-2',
                                            parentId: 'process-1',
                                            name: 'Process Tool',
                                            customIcon: 'burger',
                                            startTime: new Date('2024-04-04T12:00:20Z'),
                                            endTime: new Date('2024-04-04T12:00:28Z'),
                                            status: 'ok',
                                            attributes: {
                                                type: 'processTool',
                                                description: 'Main processing step'
                                            }
                                        }
                                    },
                                    {
                                        key: 'sub-tool-3',
                                        name: 'Post-Process Run',
                                        data: {
                                            id: 'sub-tool-3',
                                            parentId: 'process-1',
                                            name: 'Post-Process Run',
                                            customIcon: 'category',
                                            startTime: new Date('2024-04-04T12:00:25Z'),
                                            endTime: new Date('2024-04-04T12:00:30Z'),
                                            status: 'ok',
                                            attributes: {
                                                type: 'ProcessRun',
                                                description: 'Final processing step'
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                key: 'completion-1',
                                name: 'LLM Call',
                                data: {
                                    id: 'completion-1',
                                    parentId: 'agent-1',
                                    name: 'LLM Call',
                                    startTime: new Date('2024-04-04T12:00:45Z'),
                                    endTime: new Date('2024-04-04T12:00:50Z'),
                                    status: 'ok',
                                    icon: 'home', //mat-icon
                                    additionalInfo: '5s',
                                    attributes: {
                                        type: 'completion',
                                        description: 'AI text completion',
                                        usage: {
                                            completionTokens: 50,
                                            promptTokens: 100,
                                            totalTokens: 150
                                        }
                                    }
                                }
                            },
                            {
                                key: 'process-2',
                                name: 'Tool Call 2',
                                data: {
                                    id: 'process-2',
                                    parentId: 'agent-1',
                                    name: 'Tool Call 2',
                                    customIcon: 'model',
                                    startTime: new Date('2024-04-04T12:01:00Z'),
                                    endTime: new Date('2024-04-04T12:01:20Z'),
                                    status: 'ok',
                                    attributes: {
                                        type: 'toolCall',
                                        description: 'Second tool execution',
                                        toolName: 'Data_Processor'
                                    }
                                },
                                children: [
                                    {
                                        key: 'parser-1',
                                        name: 'Parser Execution',
                                        data: {
                                            id: 'parser-1',
                                            parentId: 'process-2',
                                            name: 'Parser Execution',
                                            customIcon: 'website',
                                            startTime: new Date('2024-04-04T12:01:05Z'),
                                            endTime: new Date('2024-04-04T12:01:10Z'),
                                            status: 'ok',
                                            attributes: {
                                                type: 'parser',
                                                description: 'Data parsing step'
                                            }
                                        }
                                    },
                                    {
                                        key: 'chain-1',
                                        name: 'Chain Execution',
                                        data: {
                                            id: 'chain-1',
                                            parentId: 'process-2',
                                            customIcon: 'info',
                                            name: 'Chain Execution',
                                            startTime: new Date('2024-04-04T12:01:10Z'),
                                            endTime: new Date('2024-04-04T12:01:15Z'),
                                            status: 'ok',
                                            attributes: {
                                                type: 'chain',
                                                description: 'Chain processing',
                                                chainSteps: ['Step A', 'Step B', 'Step C']
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                key: 'license-1',
                                name: 'Licensing Check',
                                data: {
                                    id: 'license-1',
                                    parentId: 'agent-1',
                                    name: 'Licensing Check',
                                    startTime: new Date('2024-04-04T12:01:20Z'),
                                    endTime: new Date('2024-04-04T12:01:25Z'),
                                    status: 'ok',
                                    customIcon: 'success',
                                    attributes: {
                                        type: 'licensing',
                                        description: 'License verification step'
                                    }
                                }
                            },
                            {
                                key: 'element-1',
                                name: 'Failed Element Execution',
                                data: {
                                    id: 'element-1',
                                    parentId: 'agent-1',
                                    name: 'Failed Element Execution',
                                    startTime: new Date('2024-04-04T12:01:30Z'),
                                    endTime: new Date('2024-04-04T12:01:35Z'),
                                    status: 'error',
                                    customIcon: 'warning',
                                    additionalInfo: '5s',
                                    attributes: {
                                        type: 'ElementRun',
                                        description: 'UI element execution that failed',
                                        error: 'Element not found'
                                    }
                                }
                            }
                        ]
                    },
                }
            }
        );
    }, 1000);
};
