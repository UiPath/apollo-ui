import { DETAIL_PAGE_HOST } from "./detail-page-host";
import type { TemplateHost } from "./template-host";

export type {
  SlotStatus,
  TemplateFrameProps,
  TemplateHost,
} from "./template-host";

/**
 * Every template previews can render, in picker order: each one's entry,
 * and nothing else about it. Adding a template: Creating occupants, "Add a
 * surface or template".
 */
export const TEMPLATE_HOSTS: Record<string, TemplateHost> = {
  "detail-page": DETAIL_PAGE_HOST,
};
