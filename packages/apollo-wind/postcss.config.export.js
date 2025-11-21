// PostCSS config for consumers
// This file can be imported/used by consuming projects

import tailwindcssPlugin from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcssPlugin, autoprefixer],
};
