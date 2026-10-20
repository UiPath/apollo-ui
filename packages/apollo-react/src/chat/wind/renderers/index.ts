import type { ChatBuiltInMessageRenderer } from '../../headless/message-renderers';
import {
  AGENTS_TOOL_CALL_RENDERER,
  APOLLO_CHAT_TREE_RENDERER,
  DEFAULT_MESSAGE_RENDERER,
} from '../../service';
import { MarkdownMessageRenderer } from './markdown-renderer';
import { ToolCallMessageRenderer } from './tool-call-renderer';
import { TreeMessageRenderer } from './tree-renderer';

/**
 * The message renderers the Wind renderer ships with. At module scope: components are element
 * types, so a new list per render remounts every message.
 */
export const WIND_MESSAGE_RENDERERS: readonly ChatBuiltInMessageRenderer[] = [
  { name: DEFAULT_MESSAGE_RENDERER, component: MarkdownMessageRenderer },
  { name: AGENTS_TOOL_CALL_RENDERER, component: ToolCallMessageRenderer },
  { name: APOLLO_CHAT_TREE_RENDERER, component: TreeMessageRenderer },
];
