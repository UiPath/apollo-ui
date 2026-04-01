"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/auth";

const FALLBACK_PATH = "/";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const returnTo =
      sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_TO) ?? FALLBACK_PATH;
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_TO);

    const search = window.location.search;
    router.replace(`${returnTo}${search}`);
  }, [router]);

  return null;
}
