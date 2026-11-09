"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageThread,
  MessageThreadHeader,
  type MessageThreadMessage,
} from "@/components/ui/message-thread";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/relative-time";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const HOUR = 3_600_000;
const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * HOUR).toISOString();

const ADDRESS_CHANGE_ID = "3";

const MESSAGES: MessageThreadMessage[] = [
  {
    id: "1",
    sender: "Sam Lee",
    senderEmail: "sam.lee@example.com",
    recipients: ["IT Support"],
    sentAt: hoursAgo(74),
    subject: "Laptop replacement request",
    body: "Hi,\n\nMy laptop battery runs out within an hour, even after the last update. Could I get a replacement?\n\nThanks,\nSam",
  },
  {
    id: "2",
    sender: "Ana Costa",
    senderEmail: "it-support@example.com",
    recipients: ["Sam Lee"],
    sentAt: hoursAgo(50),
    subject: "Re: Laptop replacement request",
    body: "Hi Sam,\n\nSorry to hear that. Can you send me the serial number from the sticker under the laptop?\n\nAna",
  },
  {
    id: ADDRESS_CHANGE_ID,
    sender: "Sam Lee",
    senderEmail: "sam.lee@example.com",
    recipients: ["IT Support"],
    sentAt: hoursAgo(26),
    subject: "Re: Laptop replacement request",
    body: "It's PF3K2L9X. Could you ship the new one to the Berlin office? I'm working from there this month.",
  },
  {
    id: "4",
    sender: "Ana Costa",
    senderEmail: "it-support@example.com",
    recipients: ["Sam Lee"],
    sentAt: hoursAgo(2),
    subject: "Re: Laptop replacement request",
    body: "Approved. The new laptop ships to the Berlin office tomorrow, and you'll get a tracking link by e-mail.",
  },
];

function ReplyForm({ onSend }: { onSend: (body: string) => void }) {
  const [draft, setDraft] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim() === "") return;
        onSend(draft.trim());
        setDraft("");
      }}
    >
      <Textarea
        aria-label="Reply"
        placeholder="Write a reply…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button type="submit" className="self-end">
        Send
      </Button>
    </form>
  );
}

function MessageThreadTemplateContent() {
  const { i18n } = useVertexTranslation();
  const [messages, setMessages] = useState(MESSAGES);
  const [solved, setSolved] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const send = (body: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        sender: "You",
        recipients: ["Sam Lee"],
        sentAt: new Date().toISOString(),
        subject: "Re: Laptop replacement request",
        body,
      },
    ]);
  };

  const latestId = messages.at(-1)?.id;
  const shown = messages.map((m): MessageThreadMessage => {
    if (m.id === ADDRESS_CHANGE_ID && !addressConfirmed) {
      return {
        ...m,
        notice: {
          status: "warning",
          label: "Address change",
          description: "The shipping address differs from the one on file.",
          actions: [
            {
              label: "Confirm address",
              onClick: () => setAddressConfirmed(true),
            },
          ],
        },
      };
    }
    if (m.id === latestId && !solved) {
      return { ...m, footer: <ReplyForm onSend={send} /> };
    }
    return m;
  });

  return (
    <div className="h-[640px] overflow-y-auto">
      <div className="mx-auto flex max-w-[800px] flex-col px-8 pt-8 pb-14">
        <MessageThreadHeader
          title="Laptop replacement request"
          badge={
            solved
              ? { label: "Solved", status: "success" }
              : { label: "Open", status: "info" }
          }
          meta={`Started ${formatRelativeTime(MESSAGES[0].sentAt, { locale: i18n.language })} · ${messages.length} messages`}
          actions={[
            solved
              ? {
                  label: "Reopen",
                  icon: RotateCcw,
                  onClick: () => setSolved(false),
                }
              : {
                  label: "Mark solved",
                  icon: CircleCheck,
                  onClick: () => setSolved(true),
                },
          ]}
        />
        <MessageThread messages={shown} />
      </div>
    </div>
  );
}

function MessageThreadTemplateWithLocale() {
  return (
    <LocaleProvider>
      <MessageThreadTemplateContent />
    </LocaleProvider>
  );
}

// Timestamps are relative to the visitor's clock, so render on the client only
export const MessageThreadTemplate = dynamic(
  () => Promise.resolve(MessageThreadTemplateWithLocale),
  { ssr: false },
);
