import { Trans } from "react-i18next";
import {
  useVertexTranslation,
  VERTEX_NAMESPACE,
} from "@/lib/vertex-translation";
import type { TranslationKey } from "./shell-translation-key";

export const Text = ({ value }: { value: TranslationKey }) => {
  const { t } = useVertexTranslation();
  if (typeof value === "string") {
    return t(value);
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
