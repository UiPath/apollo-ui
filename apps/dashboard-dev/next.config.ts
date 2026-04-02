import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack reads tsconfig.json paths automatically — no resolveAlias needed.
  // Webpack alias covers production builds.
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "../apollo-vertex");
    return config;
  },
};

export default nextConfig;
