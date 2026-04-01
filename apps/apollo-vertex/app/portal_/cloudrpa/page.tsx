"use client";

/**
 * Post-logout redirect page.
 *
 * This route exists solely as the `post_logout_redirect_uri` target for the
 * UiPath Identity Server end-session flow. It should NOT be used for any other
 * purpose. When the identity provider redirects here after logout, the page
 * reads the stored return path and navigates the user back to where they were.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/auth";

const FALLBACK_PATH = "/";

export default function PostLogoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    const returnTo =
      sessionStorage.getItem(STORAGE_KEYS.LOGOUT_RETURN_TO) ?? FALLBACK_PATH;
    sessionStorage.removeItem(STORAGE_KEYS.LOGOUT_RETURN_TO);
    router.replace(returnTo);
  }, [router]);

  return null;
}
