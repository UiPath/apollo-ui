import { useTranslation } from "react-i18next";

/** i18next namespace that Apollo Vertex components read their strings from. */
export const VERTEX_NAMESPACE = "apollo-vertex";

/**
 * `useTranslation` bound to the vertex namespace. Internal to vertex
 * components: apps never read vertex strings themselves.
 */
export const useVertexTranslation = () => useTranslation(VERTEX_NAMESPACE);
