/**
 * The neutral view model for key facts: the few facts that matter most about
 * an item, as label and value pairs. No domain terms. A solution's adapter
 * maps its own data into it; the occupant never sees the domain.
 */

export interface KeyFact {
  id: string;
  /** What the fact is, like "Status" or "Owner". */
  label: string;
  /** Its value, already formatted. Empty or missing shows as not set. */
  value?: string;
}

export interface KeyFactsViewModel {
  /** What these facts are about, for accessible names, like an item's id. */
  subject: string;
  facts: KeyFact[];
}
