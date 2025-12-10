import { visit } from 'unist-util-visit';

import {
  CHAT_CITATION_START,
  type ContentPart,
} from '../../../../service';

/**
 * Citation plugin that finds citation markers within text nodes and places citation components at exact positions
 */
export function citationPlugin() {
    // Global stack that persists across text nodes, so start/end can span nodes
    const citationStack: Array<{ citationsData: any[] }> = [];

    return (tree: any) => {
        visit(tree, 'text', (node: any, _index: number | undefined, parent: any) => {
            if (!node?.value || !parent) {
                return;
            }

            const text = String(node.value);

            const pattern = /\[\[cite-start:([^\]]+)\]\]|\[\[cite-end\]\]/g;
            const newChildren: any[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = pattern.exec(text)) !== null) {
                const before = text.slice(lastIndex, match.index);
                if (before) {
                    newChildren.push({
                        type: 'text',
                        value: before,
                    });
                }

                const token = match[0];
                if (token.startsWith('[[cite-start:')) {
                    try {
                        const decoded = atob(match[1]);
                        const citationsData = JSON.parse(decoded);
                        citationStack.push({ citationsData });

                        newChildren.push({
                            type: 'element',
                            tagName: 'span',
                            data: {
                                hName: 'span',
                                hProperties: {
                                    className: [ CHAT_CITATION_START ],
                                    'data-citation-ids': citationsData.map((c: any) => String(c.id)).join(' '),
                                    style: 'display:none',
                                },
                            },
                            children: [],
                        });
                    } catch (e) {
                        console.error('[CitationPlugin] Failed to parse citation data:', e);
                    }
                } else {
                    const info = citationStack.pop();
                    if (info) {
                        const citationComponents = info.citationsData.map((citation: any) => ({
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
                        newChildren.push(...citationComponents);
                    }
                }

                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < text.length) {
                newChildren.push({
                    type: 'text',
                    value: text.slice(lastIndex),
                });
            }

            // Replace this text node with rebuilt parts and additive markers/components
            const nodeIndex = parent.children.indexOf(node);
            if (nodeIndex >= 0) {
                parent.children.splice(nodeIndex, 1, ...newChildren);
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
 * // "UiPath offers comprehensive[[cite-start:W3siaWQiOiIxIiwidGl0bGUiOiJVaVBhdGggUGxhdGZvcm0gR3VpZGUiLCJ1cmw
 * // iOiJodHRwczovL2RvY3MudWlwYXRoLmNvbS9wbGF0Zm9ybSJ9LHsiaWQiOiIyIiwidGl0bGUiOiJBdXRvbWF0aW9uIEJlc3QgUHJhY3R
 * // pY2VzIiwicGFnZV9udW1iZXIiOjE1fV0=]]automation capabilities[[cite-end]]including[[cite-start:W3siaWQiOiIz
 * // IiwidGl0bGUiOiJQcm9kdWN0IE92ZXJ2aWV3IiwiZG93bmxvYWRfdXJsIjoiaHR0cHM6Ly91aXBhdGguY29tL3Jlc291cmNlcy9vdmVy
 * // dmlldy5wZGYifV0=]]RPA, AI, and process mining[[cite-end]]."
 * ```
 */
export function contentPartsToMarkdown(messageId: string, contentParts: ContentPart[]): string {
    const markdown = contentParts
        .map((part, _index) => {
            let text = part.text ?? '';

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
                text = `[[cite-start:${encodedData}]]${text}[[cite-end]]`;
            }
            return text;
        })
        .join('');

    return markdown;
}
