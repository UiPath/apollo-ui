"use client";

import { useEffect } from "react";
import { resolveReturnPath, STORAGE_KEYS } from "@/lib/auth";

export default function AuthCallback() {
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_TO);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_TO);

    // resolveReturnPath guards origin, falls back to the app root, and resolves
    // to the real file on Coded App builds. window.location avoids Next's router
    // doubling the basePath. Carries ?code/?state through to complete the token
    // exchange.
    const search = window.location.search;
    window.location.replace(`${resolveReturnPath(stored)}${search}`);
  }, []);

  return null;
}
