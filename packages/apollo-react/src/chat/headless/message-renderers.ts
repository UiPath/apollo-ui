import type {
  AutopilotChatMessage,
  AutopilotChatMessageComponent,
  AutopilotChatService,
} from '../service';
import { DEFAULT_MESSAGE_RENDERER } from '../service';

/**
 * A message renderer a chat renderer ships with (markdown, tool call, tree). Keep the list at
 * module scope: components are element types, so a new reference per render remounts the message.
 */
export interface ChatBuiltInMessageRenderer {
  name: string;
  component: AutopilotChatMessageComponent;
}

export type ResolvedMessageRenderer =
  /** Render this React component with `{ message }`. */
  | { kind: 'component'; component: AutopilotChatMessageComponent }
  /** Give `chatService.renderMessage` a container element to render into. */
  | { kind: 'dom' };

/**
 * Picks how to render a message: a renderer injected on the service wins over the chat renderer's
 * built-ins, and unknown widgets fall back to the built-in default (markdown).
 *
 * @returns `undefined` when nothing matches and there is no built-in default
 */
export function resolveMessageRenderer(
  chatService: AutopilotChatService,
  message: Pick<AutopilotChatMessage, 'widget'>,
  builtIns: readonly ChatBuiltInMessageRenderer[]
): ResolvedMessageRenderer | undefined {
  const injected = chatService.getMessageRenderer(message.widget);

  if (injected?.component) {
    return { kind: 'component', component: injected.component };
  }

  if (injected) {
    return { kind: 'dom' };
  }

  const builtIn =
    builtIns.find((renderer) => renderer.name === message.widget) ??
    builtIns.find((renderer) => renderer.name === DEFAULT_MESSAGE_RENDERER);

  return builtIn && { kind: 'component', component: builtIn.component };
}
