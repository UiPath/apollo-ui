import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import { activeTab, occupantsIn, type SlotContents } from "./workbench-compose";

/*
 * Each template slot's contents as a link param, <slot>-contents. Tabs are
 * joined by "~", a stack's occupants by ".", and a stack's tab starts with
 * its label's id and ":". A tab's id is its first occupant, so it isn't
 * written. For example:
 *
 *   end-panel-contents=queue~overview:key-facts.participants~activity-timeline
 *
 * The tab showing in each slot is <slot>-tab, by its id, only when it isn't
 * the one the slot opens on (activeTab).
 *
 * The focused occupant is written where it sits; a slot holding it alone
 * writes nothing. Whatever a slot can't hold is dropped when the view is
 * normalized (normalizeContents), so a bad link opens as if it had none.
 */

const TABS = "~";
const STACK = ".";
const LABEL = ":";

/** Labels a stack's tab can take, by their id in links, in the order the composer offers them. */
export const TAB_LABELS = [
  { id: "overview", key: "workbench_tab_label_overview" },
  { id: "details", key: "workbench_tab_label_details" },
  { id: "activity", key: "workbench_tab_label_activity" },
  { id: "people", key: "workbench_tab_label_people" },
] as const satisfies readonly { id: string; key: LocaleKey }[];

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

const contentsParam = (slot: string) => `${slot}-contents`;

/** One tab from its text in a link, or null when it names no occupant. */
function parseTab(text: string): TabSpec | null {
  const at = text.indexOf(LABEL);
  const labelId = at === -1 ? null : text.slice(0, at);
  const occupants = text
    .slice(at + 1)
    .split(STACK)
    .filter((name) => name.length > 0);
  const [id] = occupants;
  if (!id) return null;
  const label = TAB_LABELS.find((l) => l.id === labelId)?.key;
  return { id, ...(label && { label }), occupants };
}

/** Each of the template's slots' contents, as the link gives them. */
export function parseContents(
  host: TemplateHost | undefined,
  params: URLSearchParams,
): SlotContents {
  if (!host) return {};
  return Object.fromEntries(
    host.spec.slots.flatMap((slot) => {
      const text = params.get(contentsParam(slot.name));
      const tabs = (text ?? "")
        .split(TABS)
        .flatMap((tab) => parseTab(tab) ?? []);
      return tabs.length > 0
        ? [[slot.name, { surface: "side-panel" as const, tabs }]]
        : [];
    }),
  );
}

/** A tab as its text in a link. A label with no id in links is left out. */
function writeTab(tab: TabSpec): string {
  const labelId = TAB_LABELS.find((l) => l.key === tab.label)?.id;
  const names = tab.occupants.map(refName).join(STACK);
  return labelId ? `${labelId}${LABEL}${names}` : names;
}

/** The params for each slot's contents, but a slot holding only the focused occupant. */
export function writeContents(
  host: TemplateHost | undefined,
  contents: SlotContents,
  focus: string,
  params: URLSearchParams,
) {
  for (const slot of host?.spec.slots ?? []) {
    const panel = contents[slot.name];
    if (!panel) continue;
    const names = occupantsIn(panel);
    if (names.length === 1 && names[0] === focus) continue;
    params.set(
      contentsParam(slot.name),
      panel.tabs.map((tab) => writeTab(tab)).join(TABS),
    );
  }
}

const tabParam = (slot: string) => `${slot}-tab`;

/** The tab each of the template's slots shows, as the link gives it. */
export function parseTabs(
  host: TemplateHost | undefined,
  params: URLSearchParams,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    (host?.spec.slots ?? []).flatMap((slot) => {
      const id = params.get(tabParam(slot.name));
      return id ? [[slot.name, id]] : [];
    }),
  );
}

/** The params for each slot's tab, but one the slot opens on anyway. */
export function writeTabs(
  contents: SlotContents,
  tabs: Readonly<Record<string, string>>,
  focus: string,
  params: URLSearchParams,
) {
  for (const [slot, id] of Object.entries(tabs)) {
    const panel = contents[slot];
    if (panel && id !== activeTab(panel, focus)) params.set(tabParam(slot), id);
  }
}
