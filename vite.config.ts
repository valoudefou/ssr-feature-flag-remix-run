import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [remix(), tsconfigPaths(), react()],
  ssr: {
    noExternal: ["@flagship.io/react-sdk", "@flagship.io/js-sdk"], // avoid externalizing these for SSR
  },
  optimizeDeps: {
    include: ["@flagship.io/react-sdk", "@flagship.io/js-sdk"], // pre-bundle these dependencies
  },
  build: {
    target: "esnext", // modern build target for latest JS features
  },
});
