import {
    CHAT_CITATION_MARKER,
    type ContentPart,
} from '@uipath/portal-shell-util';
import { visit } from 'unist-util-visit';

/**
 * Citation plugin that finds citation markers across multiple text nodes
 */
export function citationPlugin() {
    return (tree: any) => {
        // Collect all text nodes to process citations that span multiple nodes
        const allTextNodes: Array<{ node: any; parent: any; index: number }> = [];

        visit(tree, 'text', (node: any, index: number, parent: any) => {
            if (node.value && parent) {
                allTextNodes.push({
                    node,
                    parent,
                    index,
                });
            }
        });

        // Find citation start and end markers using stack-based matching
        const citations: Array<{
            startNodeIndex: number;
            endNodeIndex: number;
            citationsData: any[];
            citationId: string;
        }> = [];

        // Stack to track unmatched start citations
        const citationStack: Array<{
            nodeIndex: number;
            citationsData: any[];
            citationId: string;
        }> = [];

        for (let i = 0; i < allTextNodes.length; i++) {
            const { node } = allTextNodes[i];

            // Look for citation start markers
            const startMatch = node.value.match(/\[\[cite-start:([^\]]+)\]\]/);
            if (startMatch) {
                const encodedData = startMatch[1];
                try {
                    const decodedData = atob(encodedData);
                    const citationsData = JSON.parse(decodedData);
                    const citationId = citationsData[0]?.id;

                    if (citationId) {
                        // Push onto stack
                        citationStack.push({
                            nodeIndex: i,
                            citationsData,
                            citationId,
                        });
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('[CitationPlugin] Failed to parse citation data:', e);
                }
            }

            // Look for citation end markers
            if (node.value.includes('[[cite-end]]')) {
                // Pop the most recent unmatched start citation
                const startCitation = citationStack.pop();
                if (startCitation) {
                    citations.push({
                        startNodeIndex: startCitation.nodeIndex,
                        endNodeIndex: i,
                        citationsData: startCitation.citationsData,
                        citationId: startCitation.citationId,
                    });
                }
            }
        }

        // Process citations from end to start to avoid index shifting issues
        citations.reverse().forEach(({
            startNodeIndex, endNodeIndex, citationsData,
        }) => {
            const startNode = allTextNodes[startNodeIndex];
            const endNode = allTextNodes[endNodeIndex];

            // Create citation components
            const citationNodes = citationsData.map((citation: any) => ({
                type: 'citation',
                data: {
                    hName: 'citation',
                    hProperties: {
                        id: citation.id,
                        title: citation.title,
                        url: citation.url,
                        page_number: citation.page_number,
                        download_url: citation.download_url,
                        messageId: citation.messageId,
                    },
                },
            }));

            // Clean up the start and end nodes
            const startMarkerRegex = /\[\[cite-start:[^\]]+\]\]/;
            const endMarkerRegex = /\[\[cite-end\]\]/;

            // Clean start node
            startNode.node.value = startNode.node.value.replace(startMarkerRegex, '');
            // Clean end node and add citations
            endNode.node.value = endNode.node.value.replace(endMarkerRegex, '');

            // Add invisible citation markers for each citation ID
            for (let i = startNodeIndex; i <= endNodeIndex; i++) {
                const textNode = allTextNodes[i];
                if (textNode.node.value.trim()) {
                    // Create a marker for each citation in the data
                    citationsData.forEach((citation: any) => {
                        const citationMarker = {
                            type: 'element',
                            tagName: 'span',
                            data: {
                                hName: 'span',
                                hProperties: {
                                    'data-citation-id': citation.id,
                                    className: [ CHAT_CITATION_MARKER ],
                                    style: 'position: absolute; pointer-events: none; opacity: 0;',
                                },
                            },
                            children: [],
                        };

                        // Insert the marker before the text node
                        const nodeIndex = textNode.parent.children.indexOf(textNode.node);
                        if (nodeIndex >= 0) {
                            textNode.parent.children.splice(nodeIndex, 0, citationMarker);
                        }
                    });
                }
            }

            // Add citation components at the end of the citation
            if (endNode.parent?.children) {
                endNode.parent.children.push(...(citationNodes as any[]));
            }
        });
    };
}

/**
 * Converts an array of ContentParts to markdown format with proper citation tags
 * @param messageId - The ID of the message
 * @param contentParts - Array of content parts to convert
 * @returns Markdown string with embedded citation tags
 *
 * @example
 * ```typescript
 * const contentParts = [
 *   { text: "UiPath offers comprehensive " },
 *   {
 *     text: "automation capabilities",
 *     citations: [
 *       { id: "1", title: "UiPath Platform Guide", url: "https://docs.uipath.com/platform" },
 *       { id: "2", title: "Automation Best Practices", page_number: 15 }
 *     ]
 *   },
 *   { text: " including " },
 *   {
 *     text: "RPA, AI, and process mining",
 *     citations: [
 *       { id: "3", title: "Product Overview", download_url: "https://uipath.com/resources/overview.pdf" }
 *     ]
 *   },
 *   { text: "." }
 * ];
 *
 * const markdown = contentPartsToMarkdown(contentParts);
 * // Returns:
 * // "UiPath offers comprehensive
 * //
 * // [[cite-start:W3siaWQiOiIxIiwidGl0bGUiOiJVaVBhdGggUGxhdGZvcm0gR3VpZGUiLCJ1cmwiOiJodHRwczovL2RvY3MudWlwYXRoLmNvbS
 * // 9wbGF0Zm9ybSJ9LHsiaWQiOiIyIiwidGl0bGUiOiJBdXRvbWF0aW9uIEJlc3QgUHJhY3RpY2VzIiwicGFnZV9udW1iZXIiOjE1fV0=]]
 * // automation capabilities[[cite-end]]
 * //
 * // including
 * //
 * // [[cite-start:W3siaWQiOiIzIiwidGl0bGUiOiJQcm9kdWN0IE92ZXJ2aWV3IiwiZG93bmxvYWRfdXJsIjoiaHR0cHM6Ly91aXBhdGguY29tL3Jl
 * // c291cmNlcy9vdmVydmlldy5wZGYifV0=]]
 * // RPA, AI, and process mining[[cite-end]]
 * //
 * // ."
 * ```
 */
export function contentPartsToMarkdown(messageId: string, contentParts: ContentPart[]): string {
    const markdown = contentParts
        .map((part, index) => {
            let text = part.text?.trim() ?? '';

            // If there are citations, wrap the text with citation data
            if (part.citations && part.citations.length > 0) {
                // Store all citations data as base64 encoded JSON
                const citationsData = part.citations.map(citation => ({
                    id: citation.id,
                    title: citation.title,
                    url: 'url' in citation ? citation.url : undefined,
                    download_url: 'download_url' in citation ? citation.download_url : undefined,
                    page_number: 'page_number' in citation ? citation.page_number : undefined,
                    messageId,
                }));

                const encodedData = btoa(JSON.stringify(citationsData));

                // Check if this is a table row
                const isTableRow = text.includes('|');

                if (isTableRow) {
                    // For table rows, inject citation into the last column
                    const columns = text.split('|');

                    // Find the last non-empty column (accounting for possible trailing |)
                    let lastColumnIndex = columns.length - 1;
                    while (lastColumnIndex > 0 && columns[lastColumnIndex].trim() === '') {
                        lastColumnIndex--;
                    }

                    if (lastColumnIndex > 0) {
                        // Inject citation markers into the last column content
                        const lastColumnContent = columns[lastColumnIndex].trim();
                        columns[lastColumnIndex] = ` [[cite-start:${encodedData}]]${lastColumnContent}[[cite-end]]`;
                        text = columns.join('|');
                    } else {
                        // Fallback to wrapping entire row if parsing fails
                        text = `[[cite-start:${encodedData}]]\n${part.text}[[cite-end]]`;
                    }
                } else {
                    // For non-table content, wrap normally
                    text = `[[cite-start:${encodedData}]]\n${part.text}[[cite-end]]`;
                }
            }

            // Check if this and next part are table rows for proper spacing
            const isTableRow = text.includes('|');
            const nextIsTableRow = contentParts[index + 1]?.text?.includes('|');

            // If current is a table row and next is also a table row, use single newline
            if (isTableRow && nextIsTableRow) {
                return text + '\n';
            }

            // Otherwise use default double newline separator
            return text + (index < contentParts.length - 1 ? '\n\n' : '');
        })
        .join('');

    return markdown.trim();
}
