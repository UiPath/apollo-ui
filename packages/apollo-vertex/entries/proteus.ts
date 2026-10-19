// The Proteus adapter imports @uipath/proteus-client, which is not on the
// public npm registry, so it ships from its own subpath instead of the root.
export {
  createProteusProvider,
  type FlagMapping,
  type ProteusFeatureFlagValues,
} from "@/registry/feature-flag-provider/proteus-adapter";
