import { Trans } from "react-i18next";
import {
  useVertexTranslation,
  VERTEX_NAMESPACE,
} from "@/lib/vertex-translation";
import { navCatalogFromHook, readNavLabel } from "./shell-nav-label";
import type { ShellNavLabel } from "./shell-translation-key";

export const Text = ({ value }: { value: ShellNavLabel }) => {
  const { i18n } = useVertexTranslation();
  if (typeof value === "string") {
    return readNavLabel(navCatalogFromHook(i18n), value);
  }
  return (
    <Trans
      ns={VERTEX_NAMESPACE}
      i18nKey={value.i18nKey}
      values={value.values}
      components={value.components}
    />
  );
};
