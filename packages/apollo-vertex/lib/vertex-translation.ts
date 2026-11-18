import { type UseTranslationOptions, useTranslation } from "react-i18next";

/** i18next namespace that Apollo Vertex components read their strings from. */
export const VERTEX_NAMESPACE = "apollo-vertex";

const VERTEX_TRANSLATION_OPTIONS: UseTranslationOptions<undefined> & {
  bindI18nStore: string;
} = { bindI18nStore: "added removed" };

/**
 * `useTranslation` bound to the vertex namespace. Internal to vertex
 * components: apps never read vertex strings themselves.
 */
export const useVertexTranslation = () =>
  useTranslation(VERTEX_NAMESPACE, VERTEX_TRANSLATION_OPTIONS);
