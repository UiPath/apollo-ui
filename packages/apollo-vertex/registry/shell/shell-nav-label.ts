import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";

export interface NavCatalog {
  defaultNamespace: string;
  exists: (key: string, namespace: string) => boolean;
  translate: (key: string, namespace: string) => string;
}

interface NamespacedI18n {
  options: { defaultNS?: string | false | readonly string[] };
  exists: (key: string, options?: { ns?: string }) => boolean;
  t: (key: string, options?: { ns?: string }) => unknown;
}

function defaultNamespaceOf(
  defaultNS?: string | false | readonly string[],
): string {
  if (typeof defaultNS === "string" && defaultNS.length > 0) return defaultNS;
  return "translation";
}

function isNamespacedI18n(value: object): value is NamespacedI18n {
  return (
    "options" in value &&
    "exists" in value &&
    typeof value.exists === "function" &&
    "t" in value &&
    typeof value.t === "function"
  );
}

export function navCatalogFromHook(i18n: object): NavCatalog {
  if (!isNamespacedI18n(i18n)) {
    return {
      defaultNamespace: "translation",
      exists: () => false,
      translate: (key) => key,
    };
  }

  return {
    defaultNamespace: defaultNamespaceOf(i18n.options.defaultNS),
    exists: (key, namespace) => i18n.exists(key, { ns: namespace }),
    translate: (key, namespace) => {
      const value = i18n.t(key, { ns: namespace });
      return typeof value === "string" ? value : key;
    },
  };
}

// App catalog first, then the vertex catalog. A missing key stays the raw key.
export function readNavLabel(catalog: NavCatalog, key: string): string {
  const { defaultNamespace } = catalog;
  if (
    defaultNamespace !== VERTEX_NAMESPACE &&
    catalog.exists(key, defaultNamespace)
  ) {
    return catalog.translate(key, defaultNamespace);
  }
  if (catalog.exists(key, VERTEX_NAMESPACE)) {
    return catalog.translate(key, VERTEX_NAMESPACE);
  }
  if (catalog.exists(key, defaultNamespace)) {
    return catalog.translate(key, defaultNamespace);
  }
  return key;
}
