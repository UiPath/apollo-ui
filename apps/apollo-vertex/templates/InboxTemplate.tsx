"use client";

import { Mail, Paperclip } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Inbox,
  InboxActions,
  InboxContent,
  InboxEmpty,
  InboxGroup,
  InboxHeader,
  InboxItem,
  InboxItemFooter,
  InboxItemHeader,
  InboxItemPreview,
  InboxItemSubject,
  InboxItemTime,
  InboxItemTitle,
  InboxTitle,
} from "@/components/ui/inbox";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { groupByDay } from "@/lib/relative-time";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  read: boolean;
  attachments?: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = ({
  minutes = 0,
  hours = 0,
  days = 0,
}: {
  minutes?: number;
  hours?: number;
  days?: number;
}) =>
  new Date(now - minutes * MINUTE - hours * HOUR - days * DAY).toISOString();

const MESSAGES: Message[] = [
  {
    id: "1",
    from: "Maya Patel",
    subject: "Design review moved to Thursday",
    body: "Hi all,\n\nThe design review is moving to Thursday at 10:00 so everyone can join. Same room, same agenda.\n\nMaya",
    receivedAt: ago({ minutes: 12 }),
    read: false,
  },
  {
    id: "2",
    from: "Leo Martins",
    subject: "Q3 roadmap draft",
    body: "Here's the first draft of the Q3 roadmap. Comments welcome before Friday.",
    receivedAt: ago({ hours: 3 }),
    read: false,
    attachments: 2,
  },
  {
    id: "3",
    from: "Priya Shah",
    subject: "Re: Onboarding checklist",
    body: "Thanks, I added the access requests to the checklist.",
    receivedAt: ago({ days: 1, hours: 2 }),
    read: true,
  },
  {
    id: "4",
    from: "Jonas Weber",
    subject: "Release notes for 4.2",
    body: "The release notes for 4.2 are ready for a final read.",
    receivedAt: ago({ days: 1, hours: 6 }),
    read: false,
    attachments: 1,
  },
  {
    id: "5",
    from: "Ana Costa",
    subject: "Team offsite photos",
    body: "Photos from the offsite are in the shared folder.",
    receivedAt: ago({ days: 3 }),
    read: true,
  },
  {
    id: "6",
    from: "Sam Lee",
    subject: "Budget sign-off",
    body: "Could you sign off on the updated budget by end of week?",
    receivedAt: ago({ days: 5 }),
    read: false,
  },
  {
    id: "7",
    from: "Chris Novak",
    subject: "Quarterly report",
    body: "Attached is the quarterly report.",
    receivedAt: ago({ days: 12 }),
    read: true,
    attachments: 1,
  },
];

function MessageDetail({ message }: { message: Message | undefined }) {
  if (message == null) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Select a message to read it.
      </p>
    );
  }
  return (
    <div className="h-full overflow-y-auto p-8">
      <h2 className="text-lg font-semibold">{message.subject}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {message.from}
        {" · "}
        <InboxItemTime value={message.receivedAt} />
      </p>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {message.body}
      </p>
    </div>
  );
}

function InboxTemplateContent() {
  const [messages, setMessages] = useState(MESSAGES);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The open message stays listed after it is marked read
  const visible = unreadOnly
    ? messages.filter((m) => !m.read || m.id === selectedId)
    : messages;
  const groups = groupByDay(visible, (m) => m.receivedAt);
  const selected = messages.find((m) => m.id === selectedId);

  const open = (id: string) => {
    setSelectedId(id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
    );
  };

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-[560px]">
      <ResizablePanel defaultSize="22rem" minSize="17rem" maxSize="30rem">
        <Inbox>
          <InboxHeader>
            <InboxTitle>Inbox</InboxTitle>
            <InboxActions>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    aria-label="Unread only"
                    pressed={unreadOnly}
                    onPressedChange={setUnreadOnly}
                  >
                    <Mail />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Unread only</TooltipContent>
              </Tooltip>
            </InboxActions>
          </InboxHeader>
          <InboxContent>
            {groups.length === 0 && (
              <InboxEmpty>
                {unreadOnly ? "No unread messages." : "No messages."}
              </InboxEmpty>
            )}
            {groups.map(({ group, items }) => (
              <InboxGroup key={group} group={group}>
                {items.map((m) => (
                  <InboxItem
                    key={m.id}
                    selected={m.id === selectedId}
                    unread={!m.read}
                    onClick={() => open(m.id)}
                  >
                    <InboxItemHeader>
                      <InboxItemTitle>{m.from}</InboxItemTitle>
                      <InboxItemTime value={m.receivedAt} />
                    </InboxItemHeader>
                    <InboxItemSubject>{m.subject}</InboxItemSubject>
                    <InboxItemPreview>{m.body}</InboxItemPreview>
                    {m.attachments != null && (
                      <InboxItemFooter className="text-muted-foreground">
                        <Paperclip aria-hidden />
                        {m.attachments === 1
                          ? "1 attachment"
                          : `${m.attachments} attachments`}
                      </InboxItemFooter>
                    )}
                  </InboxItem>
                ))}
              </InboxGroup>
            ))}
          </InboxContent>
        </Inbox>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <MessageDetail message={selected} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function InboxTemplateWithLocale() {
  return (
    <LocaleProvider>
      <InboxTemplateContent />
    </LocaleProvider>
  );
}

// Timestamps are relative to the visitor's clock, so render on the client only
export const InboxTemplate = dynamic(
  () => Promise.resolve(InboxTemplateWithLocale),
  { ssr: false },
);
