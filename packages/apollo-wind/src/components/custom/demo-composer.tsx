import { Plus, Settings2, Workflow } from 'lucide-react';
import {
  ChatComposer,
  ChatComposerAttachButton,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
} from '@/components/ui/chat-composer';
import { InputGroupButton } from '@/components/ui/input-group';
import { cn } from '@/lib';

export interface DemoComposerProps {
  className?: string;
  placeholder?: string;
  /** Called with the trimmed draft when the user sends. */
  onSubmit?: (value: string) => void;
}

/**
 * The prototype screens' composer: `ChatComposer` in a raised shell. Only typing and sending work;
 * the attach, workflow and settings buttons are there for the look.
 */
export function DemoComposer({ className, placeholder, onSubmit }: DemoComposerProps) {
  return (
    <ChatComposer
      className={cn('max-w-[800px] rounded-[32px] bg-surface-raised p-2', className)}
      onSubmit={(value) => onSubmit?.(value.trim())}
    >
      <ChatComposerInputGroup className="rounded-[24px] border-border bg-surface future:rounded-[24px] future:border future:border-border future:bg-surface">
        <ChatComposerTextarea placeholder={placeholder} minRows={3} className="px-1 pt-2" />
        <ChatComposerToolbar className="border-t-0 px-3 pb-3">
          <ChatComposerAttachButton size="xs">
            <Plus />
          </ChatComposerAttachButton>
          <InputGroupButton aria-label="Add workflow" icon size="xs">
            <Workflow />
          </InputGroupButton>
          <InputGroupButton aria-label="Settings" icon size="xs">
            <Settings2 />
          </InputGroupButton>
          <ChatComposerSubmit size="xs" />
        </ChatComposerToolbar>
      </ChatComposerInputGroup>
    </ChatComposer>
  );
}
