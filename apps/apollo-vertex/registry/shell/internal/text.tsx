import { Trans, useTranslation } from "react-i18next";
import { TranslationKey } from "./TranslationKey";

export const Text = ({ value }: { value: TranslationKey }) => {
  const { t } = useTranslation();
  if (typeof value === "string") {
    return t(value);
  }
  return (
    <Trans
      i18nKey={value.i18nKey}
      values={value.values}
      components={value.components}
    />
  );
};
