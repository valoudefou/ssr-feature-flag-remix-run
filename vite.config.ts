import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [remix(), tsconfigPaths(), react()],
  ssr: {
    noExternal: ["@flagship.io/react-sdk", "@flagship.io/js-sdk"],
  },
  optimizeDeps: {
    include: ["@flagship.io/react-sdk", "@flagship.io/js-sdk"],
  },
  build: {
    target: "esnext",
  },
  server: {
    hmr: {
      overlay: false, // disables the error overlay, can reduce conflicts
      // Or fully disable HMR (not recommended)
      // protocol: 'ws',
      // clientPort: 0,
      // host: 'localhost',
      // timeout: 30000,
      // path: '/hmr',
      // port: 24678,
    },
  },
});
