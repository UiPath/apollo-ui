import type { ChatBuiltInMessageRenderer } from '../../headless/message-renderers';
import { DEFAULT_MESSAGE_RENDERER } from '../../service';
import { MarkdownMessageRenderer } from './markdown-renderer';

/**
 * The message renderers the Wind renderer ships with. At module scope: components are element
 * types, so a new list per render remounts every message.
 */
export const WIND_MESSAGE_RENDERERS: readonly ChatBuiltInMessageRenderer[] = [
  { name: DEFAULT_MESSAGE_RENDERER, component: MarkdownMessageRenderer },
];
