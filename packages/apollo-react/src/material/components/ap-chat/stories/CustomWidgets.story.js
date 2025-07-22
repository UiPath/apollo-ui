import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const CustomWidgets = (args) => template(args, 'custom-widgets');

CustomWidgets.args = {
    ...defaultArgs,
    showFirstRun: false,
};

CustomWidgets.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'custom-widgets';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Define custom chart widget web component
    if (!customElements.get('chart-widget')) {
        class ChartWidget extends HTMLElement {
            connectedCallback() {
                this.render();
            }

            render() {
                this.style.cssText = `
                    display: block;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 8px;
                    color: white;
                    margin: 10px 0;
                `;

                const title = document.createElement('h3');
                title.textContent = 'Sales Performance Chart';
                title.style.margin = '0 0 15px 0';
                this.appendChild(title);

                // Simple bar chart simulation
                const data = [
                    {
                        month: 'Jan',
                        value: 65,
                    },
                    {
                        month: 'Feb',
                        value: 78,
                    },
                    {
                        month: 'Mar',
                        value: 90,
                    },
                    {
                        month: 'Apr',
                        value: 81,
                    },
                    {
                        month: 'May',
                        value: 95,
                    },
                ];

                data.forEach(item => {
                    const bar = document.createElement('div');
                    bar.style.cssText = `
                        display: flex;
                        align-items: center;
                        margin: 8px 0;
                    `;

                    const label = document.createElement('span');
                    label.textContent = item.month;
                    label.style.cssText = 'width: 40px; font-size: 14px;';

                    const barFill = document.createElement('div');
                    barFill.style.cssText = `
                        height: 20px;
                        background: rgba(255,255,255,0.8);
                        margin-left: 10px;
                        border-radius: 4px;
                        width: ${item.value}%;
                        transition: width 0.3s ease;
                    `;

                    const value = document.createElement('span');
                    value.textContent = `${item.value}%`;
                    value.style.cssText = 'margin-left: 10px; font-size: 12px;';

                    bar.appendChild(label);
                    bar.appendChild(barFill);
                    bar.appendChild(value);
                    this.appendChild(bar);
                });
            }
        }
        customElements.define('chart-widget', ChartWidget);
    }

    // Register custom chart widget
    chatService.injectMessageRenderer({
        name: 'chart-widget',
        render: (element) => {
            const chartWidget = document.createElement('chart-widget');
            element.appendChild(chartWidget);
        },
    });

    // Define custom data table widget web component
    if (!customElements.get('data-table-widget')) {
        class DataTableWidget extends HTMLElement {
            connectedCallback() {
                this.render();
            }

            render() {
                this.style.cssText = `
                    display: block;
                    margin: 10px 0;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                `;

                const table = document.createElement('table');
                table.style.cssText = `
                    width: 100%;
                    border-collapse: collapse;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                `;

                const headerData = [ 'Process', 'Status', 'Runtime', 'Success Rate' ];
                const rowData = [
                    [ 'Invoice Processing', 'Active', '2.3s', '98.5%' ],
                    [ 'Data Extraction', 'Idle', '1.8s', '99.2%' ],
                    [ 'Email Automation', 'Running', '0.9s', '97.8%' ],
                    [ 'Report Generation', 'Scheduled', '5.2s', '99.9%' ],
                ];

                // Create header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                headerRow.style.backgroundColor = '#f5f5f5';

                headerData.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    th.style.cssText = `
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        border-bottom: 1px solid #e0e0e0;
                    `;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Create body
                const tbody = document.createElement('tbody');
                rowData.forEach((row, index) => {
                    const tr = document.createElement('tr');
                    tr.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';

                    row.forEach((cellText, cellIndex) => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        td.style.cssText = `
                            padding: 12px;
                            border-bottom: 1px solid #e0e0e0;
                        `;

                        // Add status indicators
                        if (cellIndex === 1) {
                            const statusColors = {
                                'Active': '#4caf50',
                                'Running': '#2196f3',
                                'Idle': '#ff9800',
                                'Scheduled': '#9c27b0',
                            };
                            td.style.color = statusColors[cellText] || '#000';
                            td.style.fontWeight = '600';
                        }

                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);

                this.appendChild(table);
            }
        }
        customElements.define('data-table-widget', DataTableWidget);
    }

    // Register custom data table widget
    chatService.injectMessageRenderer({
        name: 'data-table-widget',
        render: (element) => {
            const tableWidget = document.createElement('data-table-widget');
            element.appendChild(tableWidget);
        },
    });

    // Define custom workflow widget web component
    if (!customElements.get('workflow-widget')) {
        class WorkflowWidget extends HTMLElement {
            connectedCallback() {
                this.render();
            }

            render() {
                this.style.cssText = `
                    display: block;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin: 10px 0;
                    border-left: 4px solid #2196f3;
                `;

                const title = document.createElement('h3');
                title.textContent = 'Workflow Steps';
                title.style.cssText = 'margin: 0 0 15px 0; color: #333;';
                this.appendChild(title);

                const steps = [
                    {
                        name: 'Read Email',
                        status: 'completed',
                        duration: '0.2s',
                    },
                    {
                        name: 'Extract Data',
                        status: 'completed',
                        duration: '1.1s',
                    },
                    {
                        name: 'Validate Input',
                        status: 'running',
                        duration: '0.8s',
                    },
                    {
                        name: 'Process Payment',
                        status: 'pending',
                        duration: '--',
                    },
                    {
                        name: 'Send Confirmation',
                        status: 'pending',
                        duration: '--',
                    },
                ];

                steps.forEach((step, index) => {
                    const stepElement = document.createElement('div');
                    stepElement.style.cssText = `
                        display: flex;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: ${index < steps.length - 1 ? '1px solid #e0e0e0' : 'none'};
                    `;

                    const statusIcon = document.createElement('div');
                    const statusColors = {
                        'completed': '#4caf50',
                        'running': '#ff9800',
                        'pending': '#ccc',
                    };
                    statusIcon.style.cssText = `
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: ${statusColors[step.status]};
                        margin-right: 12px;
                        ${step.status === 'running' ? 'animation: pulse 2s infinite;' : ''}
                    `;

                    const stepName = document.createElement('span');
                    stepName.textContent = step.name;
                    stepName.style.cssText = 'flex: 1; font-weight: 500;';

                    const duration = document.createElement('span');
                    duration.textContent = step.duration;
                    duration.style.cssText = 'color: #666; font-size: 12px;';

                    stepElement.appendChild(statusIcon);
                    stepElement.appendChild(stepName);
                    stepElement.appendChild(duration);
                    this.appendChild(stepElement);
                });

                // Add CSS animation for pulsing effect (only once)
                if (!document.querySelector('#workflow-pulse-animation')) {
                    const style = document.createElement('style');
                    style.id = 'workflow-pulse-animation';
                    style.textContent = `
                        @keyframes pulse {
                            0% { opacity: 1; }
                            50% { opacity: 0.5; }
                            100% { opacity: 1; }
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        }
        customElements.define('workflow-widget', WorkflowWidget);
    }

    // Register custom workflow widget
    chatService.injectMessageRenderer({
        name: 'workflow-widget',
        render: (element) => {
            const workflowWidget = document.createElement('workflow-widget');
            element.appendChild(workflowWidget);
        },
    });

    // Clear any existing conversation and send demo messages
    chatService.newChat();

    // Send demo messages with custom widgets
    setTimeout(() => {
        chatService.sendRequest({ content: 'Can you show me our sales performance?' });

        setTimeout(() => {
            chatService.sendResponse({
                content: 'Here\'s your sales performance data:',
                widget: 'chart-widget',
                actions: [
                    {
                        name: 'export',
                        label: 'Export Chart',
                        icon: 'download',
                        eventName: 'export-chart',
                    },
                ],
            });
        }, 1000);

        setTimeout(() => {
            chatService.sendRequest({ content: 'What about our automation processes?' });
        }, 2000);

        setTimeout(() => {
            chatService.sendResponse({
                content: 'Here\'s the current status of your automation processes:',
                widget: 'data-table-widget',
            });
        }, 3000);

        setTimeout(() => {
            chatService.sendRequest({ content: 'Show me the workflow for the last process' });
        }, 4000);

        setTimeout(() => {
            chatService.sendResponse({
                content: 'Here\'s the current workflow execution:',
                widget: 'workflow-widget',
            });
        }, 5000);
    }, 1000);

    // Handle custom actions
    chatService.on('export-chart', () => {
        chatService.sendResponse({ content: '📊 Chart exported successfully! The sales data has been saved to your downloads folder.' });
    });
};
