"use client";

/**
 * Post-logout redirect page.
 *
 * This route exists solely as the `post_logout_redirect_uri` target for the
 * UiPath Identity Server end-session flow. It should NOT be used for any other
 * purpose. When the identity provider redirects here after logout, the page
 * reads the stored return path and navigates the user back to where they were.
 */

import { useEffect } from "react";
import { resolveReturnPath, STORAGE_KEYS } from "@/lib/auth";

export default function PostLogoutRedirect() {
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.LOGOUT_RETURN_TO);
    sessionStorage.removeItem(STORAGE_KEYS.LOGOUT_RETURN_TO);

    // resolveReturnPath guards origin, falls back to the app root, and resolves
    // to the real file on Coded App builds. window.location avoids Next's router
    // doubling the basePath already present in the stored path.
    window.location.replace(resolveReturnPath(stored));
  }, []);

  return null;
}
