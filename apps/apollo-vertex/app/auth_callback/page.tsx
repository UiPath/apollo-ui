"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/auth";

const FALLBACK_PATH = "/";

export default function AuthCallback() {
  useEffect(() => {
    const returnTo =
      sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_TO) ?? FALLBACK_PATH;
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_TO);

    // returnTo is an absolute path already including the Coded App base path
    // (captured from window.location.pathname at sign-in), so navigate with
    // window.location rather than Next's router, which would prepend basePath
    // again and double it. Carries the ?code/?state through to the page that
    // completes the token exchange.
    const search = window.location.search;
    window.location.replace(`${returnTo}${search}`);
  }, []);

  return null;
}
