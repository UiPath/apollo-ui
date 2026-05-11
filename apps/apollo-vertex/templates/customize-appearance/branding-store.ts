"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "default" | "custom";

export interface BrandingSettings {
  themeMode: ThemeMode;
  appTitle: string;
  logoUrl: string;
  logoAlt: string;
  primaryColor: string;
  accentColor: string;
}

// Persistence adapter — swap the default localStorage implementation with a
// Data Fabric (or other backend) adapter to sync branding across users.
export interface BrandingAdapter {
  load(): Promise<Partial<BrandingSettings> | null>;
  // Persist non-logo fields. Logo upload/clear is handled via uploadLogo /
  // clearLogo so backends that store logos as attachments (e.g. Data Fabric)
  // can upload the File directly instead of embedding a data URL in the
  // settings record.
  save(settings: BrandingSettings): Promise<void>;
  // Returns the URL (or data URL) to display for the newly uploaded logo.
  uploadLogo?(file: File): Promise<string>;
  // Remove the current logo from the backend (e.g. delete the attachment).
  clearLogo?(): Promise<void>;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  themeMode: "default",
  appTitle: "",
  logoUrl: "",
  logoAlt: "",
  primaryColor: "",
  accentColor: "",
};

const STORAGE_KEY = "vertex-branding";

function parseStored(raw: string): Partial<BrandingSettings> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Partial<BrandingSettings>;
    }
    return null;
  } catch {
    return null;
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("FileReader did not return a string"));
      }
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read file"));
    });
    reader.readAsDataURL(file);
  });
}

export function createLocalStorageAdapter(
  key: string = STORAGE_KEY,
): BrandingAdapter {
  return {
    load() {
      if (typeof window === "undefined") return Promise.resolve(null);
      const raw = window.localStorage.getItem(key);
      return Promise.resolve(raw ? parseStored(raw) : null);
    },
    save(settings) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(settings));
      }
      return Promise.resolve();
    },
    // localStorage embeds the logo as a data URL inside the settings record,
    // so uploadLogo just returns the data URL form of the file and clearLogo
    // is a no-op (the logoUrl is already cleared in the settings record).
    uploadLogo(file) {
      return readFileAsDataUrl(file);
    },
    clearLogo() {
      return Promise.resolve();
    },
  };
}

type Listener = () => void;

interface StoreState {
  current: BrandingSettings;
  saved: BrandingSettings;
  pendingLogoFile: File | null;
  shouldClearLogo: boolean;
}

let state: StoreState = {
  current: { ...DEFAULT_BRANDING },
  saved: { ...DEFAULT_BRANDING },
  pendingLogoFile: null,
  shouldClearLogo: false,
};
let adapter: BrandingAdapter = createLocalStorageAdapter();
let hasLoaded = false;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function getState(): StoreState {
  return state;
}

function getCurrent(): BrandingSettings {
  return state.current;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const brandingStore = {
  getState,
  getCurrent,
  subscribe,
  setCurrent(partial: Partial<BrandingSettings>) {
    state = { ...state, current: { ...state.current, ...partial } };
    emit();
  },
  // Stage a new logo: read the file as a data URL for immediate preview and
  // hold the File object until the user clicks Save, at which point the real
  // upload runs via the adapter.
  async stageLogo(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    state = {
      ...state,
      current: { ...state.current, logoUrl: dataUrl, logoAlt: file.name },
      pendingLogoFile: file,
      shouldClearLogo: false,
    };
    emit();
  },
  // Flag the logo for removal on next save. Also discards any pending upload.
  removeLogo() {
    const savedHasLogo = !!state.saved.logoUrl;
    state = {
      ...state,
      current: { ...state.current, logoUrl: "", logoAlt: "" },
      pendingLogoFile: null,
      // Only ask the backend to clear if there was a saved logo to remove.
      shouldClearLogo: savedHasLogo,
    };
    emit();
  },
  setAdapter(next: BrandingAdapter) {
    adapter = next;
    hasLoaded = false;
  },
  async hydrate() {
    if (hasLoaded) return;
    hasLoaded = true;
    const loaded = await adapter.load();
    if (loaded) {
      const merged = { ...DEFAULT_BRANDING, ...loaded };
      state = {
        current: merged,
        saved: merged,
        pendingLogoFile: null,
        shouldClearLogo: false,
      };
      emit();
    }
  },
  async save() {
    const next = { ...state.current };

    if (state.pendingLogoFile && adapter.uploadLogo) {
      next.logoUrl = await adapter.uploadLogo(state.pendingLogoFile);
    } else if (state.shouldClearLogo && adapter.clearLogo) {
      await adapter.clearLogo();
    }

    await adapter.save(next);

    state = {
      current: next,
      saved: next,
      pendingLogoFile: null,
      shouldClearLogo: false,
    };
    emit();
  },
  async reset() {
    const savedHasLogo = !!state.saved.logoUrl;
    const next = { ...DEFAULT_BRANDING };

    if (savedHasLogo && adapter.clearLogo) {
      await adapter.clearLogo();
    }
    await adapter.save(next);

    state = {
      current: next,
      saved: next,
      pendingLogoFile: null,
      shouldClearLogo: false,
    };
    emit();
  },
};

export function useBrandingStore(): BrandingSettings {
  return useSyncExternalStore(subscribe, getCurrent, getCurrent);
}

export function useBrandingHasChanges(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      const { current, saved, pendingLogoFile, shouldClearLogo } = getState();
      return (
        !!pendingLogoFile ||
        shouldClearLogo ||
        current.themeMode !== saved.themeMode ||
        current.appTitle !== saved.appTitle ||
        current.logoUrl !== saved.logoUrl ||
        current.logoAlt !== saved.logoAlt ||
        current.primaryColor !== saved.primaryColor ||
        current.accentColor !== saved.accentColor
      );
    },
    () => false,
  );
}
