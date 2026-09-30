/**
 * The neutral view model for the participants: the people involved with an
 * item, what each one does, and when they last acted. No domain terms. A
 * solution's adapter maps its own data into it; the occupant never sees the
 * domain.
 */

export interface Participant {
  id: string;
  /** The person's name. */
  name: string;
  /** What they do on this item, like reviewer or owner. */
  role?: string;
  /** When they last acted on it, formatted for display. */
  lastActive?: string;
}

export interface ParticipantsViewModel {
  /** What the people are involved with, for accessible names, like an item's id. */
  subject: string;
  participants: Participant[];
}
