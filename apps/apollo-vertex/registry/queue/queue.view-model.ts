/**
 * The neutral view model for the queue: a list of items to work through,
 * grouped and filtered, where picking one opens it. No domain terms. A
 * solution's adapter maps its own data into it; the occupant never sees the
 * domain.
 */

import type { OccupantStatusValue } from "@/components/ui/occupant";

export interface QueueItem {
  id: string;
  /** The item's name, the main text on its card. */
  title: string;
  /** The item's key figure, like an amount or a time left, formatted for display. */
  value?: string;
  /** Why the item needs attention, and how urgent it reads. */
  status: OccupantStatusValue;
  /** A short id people use to find the item elsewhere. */
  reference?: string;
  /** The label it's grouped under. Groups show in the order they first appear. */
  group: string;
  /** The id of the filter it belongs to, from filters. */
  filter: string;
}

export interface QueueFilter {
  id: string;
  label: string;
}

export interface QueueViewModel {
  /** What the queue holds, for accessible names, like the name of the work. */
  subject: string;
  /** The tabs that filter the items, in order. "All" comes first on its own. */
  filters: QueueFilter[];
  items: QueueItem[];
}
