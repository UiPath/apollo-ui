import { createFromSource } from "fumadocs-core/search/server";
import { source } from "../../lib/source";

// Exported at build time and searched client-side. This lives outside app/api
// because the Coded App build drops that directory.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
