import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";

export interface NavCatalog {
  namespaces: readonly string[];
  exists: (key: string, namespace: string) => boolean;
  translate: (key: string, namespace: string) => string;
}

interface NamespacedI18n {
  options: { defaultNS?: string | false | readonly string[] };
  exists: (key: string, options?: { ns?: string }) => boolean;
  t: (key: string, options?: { ns?: string }) => unknown;
}

function configuredNamespaces(
  defaultNS: string | false | readonly string[] | undefined,
): readonly string[] {
  if (typeof defaultNS === "string") {
    return defaultNS.length > 0 ? [defaultNS] : ["translation"];
  }
  if (!Array.isArray(defaultNS)) return ["translation"];

  const namespaces: string[] = [];
  for (const namespace of defaultNS) {
    if (typeof namespace === "string" && namespace.length > 0) {
      namespaces.push(namespace);
    }
  }
  return namespaces.length > 0 ? namespaces : ["translation"];
}

function lookupNamespaces(
  defaultNS: string | false | readonly string[] | undefined,
): readonly string[] {
  const configured = configuredNamespaces(defaultNS);
  if (configured.includes(VERTEX_NAMESPACE)) return configured;
  return [...configured, VERTEX_NAMESPACE];
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
      namespaces: ["translation", VERTEX_NAMESPACE],
      exists: () => false,
      translate: (key) => key,
    };
  }

  return {
    namespaces: lookupNamespaces(i18n.options.defaultNS),
    exists: (key, namespace) => i18n.exists(key, { ns: namespace }),
    translate: (key, namespace) => {
      const value = i18n.t(key, { ns: namespace });
      return typeof value === "string" ? value : key;
    },
  };
}

// Configured namespaces in order, then the vertex catalog. A missing key stays the raw key.
export function readNavLabel(catalog: NavCatalog, key: string): string {
  for (const namespace of catalog.namespaces) {
    if (catalog.exists(key, namespace)) {
      return catalog.translate(key, namespace);
    }
  }
  return key;
}
