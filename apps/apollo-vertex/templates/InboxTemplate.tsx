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
  MessageThread,
  MessageThreadHeader,
  type MessageThreadMessage,
} from "@/components/ui/message-thread";
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

interface Conversation {
  id: string;
  subject: string;
  read: boolean;
  attachments?: number;
  /** Oldest first */
  messages: [MessageThreadMessage, ...MessageThreadMessage[]];
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

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    subject: "Design review moved to Thursday",
    read: false,
    messages: [
      {
        id: "1-1",
        subject: "Design review moved to Thursday",
        sender: "Maya Patel",
        sentAt: ago({ hours: 2 }),
        body: "Hi all,\n\nThe design review is moving to Thursday at 10:00 so everyone can join. Same room, same agenda.\n\nMaya",
      },
      {
        id: "1-2",
        subject: "Re: Design review moved to Thursday",
        sender: "Jonas Weber",
        sentAt: ago({ hours: 1 }),
        body: "Works for me. Can we add ten minutes for the icon updates?",
      },
      {
        id: "1-3",
        subject: "Re: Design review moved to Thursday",
        sender: "Maya Patel",
        sentAt: ago({ minutes: 12 }),
        body: "Sure, I added it to the end of the agenda.",
      },
    ],
  },
  {
    id: "2",
    subject: "Q3 roadmap draft",
    read: false,
    attachments: 2,
    messages: [
      {
        id: "2-1",
        subject: "Q3 roadmap draft",
        sender: "Leo Martins",
        sentAt: ago({ hours: 3 }),
        body: "Here's the first draft of the Q3 roadmap. Comments welcome before Friday.",
      },
    ],
  },
  {
    id: "3",
    subject: "Onboarding checklist",
    read: true,
    messages: [
      {
        id: "3-1",
        subject: "Onboarding checklist",
        sender: "Ana Costa",
        sentAt: ago({ days: 2 }),
        body: "Could you add the access requests to the onboarding checklist?",
      },
      {
        id: "3-2",
        subject: "Re: Onboarding checklist",
        sender: "Priya Shah",
        sentAt: ago({ days: 1, hours: 2 }),
        body: "Thanks, I added the access requests to the checklist.",
      },
    ],
  },
  {
    id: "4",
    subject: "Release notes for 4.2",
    read: false,
    attachments: 1,
    messages: [
      {
        id: "4-1",
        subject: "Release notes for 4.2",
        sender: "Jonas Weber",
        sentAt: ago({ days: 1, hours: 6 }),
        body: "The release notes for 4.2 are ready for a final read.",
      },
    ],
  },
  {
    id: "5",
    subject: "Team offsite photos",
    read: true,
    messages: [
      {
        id: "5-1",
        subject: "Team offsite photos",
        sender: "Ana Costa",
        sentAt: ago({ days: 3 }),
        body: "Photos from the offsite are in the shared folder.",
      },
    ],
  },
  {
    id: "6",
    subject: "Budget sign-off",
    read: false,
    messages: [
      {
        id: "6-1",
        subject: "Budget sign-off",
        sender: "Chris Novak",
        sentAt: ago({ days: 6 }),
        body: "I updated the budget with the new travel costs.",
      },
      {
        id: "6-2",
        subject: "Re: Budget sign-off",
        sender: "Sam Lee",
        sentAt: ago({ days: 5 }),
        body: "Could you sign off on the updated budget by end of week?",
      },
    ],
  },
  {
    id: "7",
    subject: "Quarterly report",
    read: true,
    attachments: 1,
    messages: [
      {
        id: "7-1",
        subject: "Quarterly report",
        sender: "Chris Novak",
        sentAt: ago({ days: 12 }),
        body: "Attached is the quarterly report.",
      },
    ],
  },
];

const latestOf = (c: Conversation) => c.messages.at(-1) ?? c.messages[0];

function ConversationDetail({
  conversation,
}: {
  conversation: Conversation | undefined;
}) {
  if (conversation == null) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Select a conversation to read it.
      </p>
    );
  }
  const count = conversation.messages.length;
  return (
    <div className="h-full overflow-y-auto px-8 pt-8 pb-14">
      <MessageThreadHeader
        title={conversation.subject}
        meta={count === 1 ? "1 message" : `${count} messages`}
      />
      <MessageThread key={conversation.id} messages={conversation.messages} />
    </div>
  );
}

function InboxTemplateContent() {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The open conversation stays listed after it is marked read
  const visible = unreadOnly
    ? conversations.filter((c) => !c.read || c.id === selectedId)
    : conversations;
  const groups = groupByDay(visible, (c) => latestOf(c).sentAt);
  const selected = conversations.find((c) => c.id === selectedId);

  const open = (id: string) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, read: true } : c)),
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
                {items.map((c) => {
                  const latest = latestOf(c);
                  return (
                    <InboxItem
                      key={c.id}
                      selected={c.id === selectedId}
                      unread={!c.read}
                      onClick={() => open(c.id)}
                    >
                      <InboxItemHeader>
                        <InboxItemTitle>{latest.sender}</InboxItemTitle>
                        <InboxItemTime value={latest.sentAt} />
                      </InboxItemHeader>
                      <InboxItemSubject>{c.subject}</InboxItemSubject>
                      <InboxItemPreview>{latest.body}</InboxItemPreview>
                      {c.attachments != null && (
                        <InboxItemFooter className="text-muted-foreground">
                          <Paperclip aria-hidden />
                          {c.attachments === 1
                            ? "1 attachment"
                            : `${c.attachments} attachments`}
                        </InboxItemFooter>
                      )}
                    </InboxItem>
                  );
                })}
              </InboxGroup>
            ))}
          </InboxContent>
        </Inbox>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <ConversationDetail conversation={selected} />
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
