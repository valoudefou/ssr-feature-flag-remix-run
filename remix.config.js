import { defineConfig } from '@remix-run/dev';

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default defineConfig({
  serverBuildTarget: "vercel",
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

