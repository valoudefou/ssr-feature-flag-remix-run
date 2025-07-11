import { vercelPreset } from "vercel-remix";

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  // your config...
  serverBuildTarget: "vercel",
  server: vercelPreset(),
};
