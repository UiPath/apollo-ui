"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CommunicationCardProps {
  /** The log — mapped `RecordEntry`s plus whatever else closes the record
   * (a waiting banner, a P2-only appended entry). Caller-built, since the
   * two personas' entries differ in shape, not just content. */
  entries: ReactNode;
  /** The composer block (suggested replies, textarea, footer, posting
   * line), pre-rendered. Omitted entirely — not just hidden — once there's
   * nothing to compose (e.g. the requester's terminal states). */
  composer?: ReactNode;
}

/**
 * Communication as a card in the main column — shared shell (label, log
 * wrapper, composer wrapper) so the requester's and the approver's threads
 * can't drift on structure independently, even though each supplies its own
 * entries and composer body. Not part of the three-zone RecordCard
 * template: Communication was never zoned findings/actions, it's a plain
 * record with an optional composer at its foot.
 */
export function CommunicationCard({
  entries,
  composer,
}: CommunicationCardProps) {
  return (
    <Card variant="glass" className="py-0">
      <CardContent className="p-5">
        <div className="text-base font-bold tracking-tighter text-foreground">
          Communication
        </div>

        <div className="mt-4 space-y-4">{entries}</div>

        {composer != null && (
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            {composer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
