export type StickyNoteColor = "yellow" | "pink" | "blue" | "green" | "purple" | "orange" | "white";

export interface StickyNoteData extends Record<string, unknown> {
  color?: StickyNoteColor;
  content?: string;
}

export const STICKY_NOTE_COLORS: Record<StickyNoteColor, string> = {
  yellow: "#FDE68A",
  pink: "#FBCFE8",
  blue: "#BFDBFE",
  green: "#BBF7D0",
  purple: "#DDD6FE",
  orange: "#FED7AA",
  white: "#F3F4F6",
};
