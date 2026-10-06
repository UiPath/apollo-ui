"use client";

import i18n from "i18next";
import type { PropsWithChildren } from "react";
import {
  LocaleProvider,
  LocaleProviderComponent,
} from "@/registry/shell/shell-locale-provider";

/**
 * The Shell's locale provider, without its loading gate once i18n is
 * configured. LocaleProvider shows a spinner on every mount until its
 * async configure resolves, even when the page configured i18n already,
 * so each remount (a new occupant, sample, or view) flashed a spinner for
 * a few frames. Configured, it renders straight away, still listening
 * for language changes; not yet, it's the Shell's provider as before.
 */
export function LocaleReady({ children }: PropsWithChildren) {
  // The one i18next instance lib/i18n configures; once set, it stays set.
  if (i18n.isInitialized)
    return <LocaleProviderComponent>{children}</LocaleProviderComponent>;
  return <LocaleProvider>{children}</LocaleProvider>;
}
