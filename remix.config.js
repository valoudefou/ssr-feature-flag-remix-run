import { defineConfig } from '@remix-run/dev';
import vercel from '@remix-run/vercel';

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default defineConfig({
  serverBuildTarget: "vercel",
  server: vercel(),
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  future: {
    v2_routeConvention: true,
    v2_meta: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_normalizeFormMethod: true,
  },
});
