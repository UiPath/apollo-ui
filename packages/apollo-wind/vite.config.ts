import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.stories.ts",
        "src/**/*.stories.tsx",
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ApolloWind",
      formats: ["es", "cjs"],
      fileName: (format) => {
        return format === "es" ? "index.js" : "index.cjs";
      },
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "styles.css";
          return assetInfo.name || "";
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
