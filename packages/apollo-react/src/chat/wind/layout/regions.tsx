import { WindChatComposer } from '../composer/chat-composer';

/** The prompt input, with its error and footer disclaimer. */
export function ComposerRegion() {
  return (
    <div data-slot="wind-chat-composer" className="flex shrink-0 flex-col pt-1">
      <WindChatComposer />
    </div>
  );
}
