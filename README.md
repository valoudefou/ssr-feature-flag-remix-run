<img src="https://content.partnerpage.io/eyJidWNrZXQiOiJwYXJ0bmVycGFnZS5wcm9kIiwia2V5IjoibWVkaWEvY29udGFjdF9pbWFnZXMvMDUwNGZlYTYtOWIxNy00N2IyLTg1YjUtNmY5YTZjZWU5OTJiLzI1NjhmYjk4LTQwM2ItNGI2OC05NmJiLTE5YTg1MzU3ZjRlMS5wbmciLCJlZGl0cyI6eyJ0b0Zvcm1hdCI6IndlYnAiLCJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6NjI3LCJmaXQiOiJjb250YWluIiwiYmFja2dyb3VuZCI6eyJyIjoyNTUsImciOjI1NSwiYiI6MjU1LCJhbHBoYSI6MH19fX0=" alt="AB Tasty logo" width="350"/>

# Remix Run Feature Flags Integration with Flagship SDK

This repository demonstrates how to implement server-side feature flags in a Remix Run application using the Flagship SDK, with server-side rendering (SSR) support for better performance and user experience.

---

## Overview

Feature flags allow you to dynamically toggle features and content variations in your application without deploying new code. This guide shows how to integrate Flagship.io feature flags into a Remix Run app, ensuring:

- Flags are fetched on the server during Remix loaders.
- Flag data is passed to the client to avoid UI flicker and hydration mismatch.
- Improved Core Web Vitals and Lighthouse scores by reducing layout shifts and client-side JavaScript.

---

## How It Works

1. **Flagship SDK Integration**

   - Uses the official `@flagship.io/react-sdk`.
   - Server-side initialization of the Flagship SDK with environment variables (`FS_ENV_ID`, `FS_API_KEY`).
   - Creates visitor instances with context to fetch flags.

2. **Remix Loader Usage**

   - In Remix's `loader` function, create a visitor with the Flagship SDK.
   - Fetch flags on the server before rendering the page.
   - Use flag values (e.g., recommendation strategy IDs) to fetch dynamic content (like product recommendations) from an API.
   - Return flag data and related content in the loader JSON response.

3. **Passing Flag Data to Client**

   - Remix automatically serializes the loader data and hydrates it on the client.
   - This approach prevents UI flickering caused by client-only flag fetches.
   - The React component uses `useLoaderData()` to access flags and render consistently.

4. **Performance Benefits**

   - **Reduced Cumulative Layout Shift (CLS):** Flags fetched server-side avoid content jumping as UI updates post-load.
   - **Improved Largest Contentful Paint (LCP):** Content is ready immediately on initial load.
   - **Minimized JavaScript Execution:** Client JavaScript doesn't need to refetch flags, lowering execution time and improving responsiveness.

---

## Setup Instructions

1. **Install dependencies**

```bash
npm install @flagship.io/react-sdk remix react react-dom
```

2. **Environment variables**

Create a `.env` file or use your deployment environment to set:

```env
FS_ENV_ID=your_flagship_env_id
FS_API_KEY=your_flagship_api_key
SITE_ID=your_abtasty_site_id
RECS_BEARER=your_abtasty_recs_bearer_token
```

3. **Vite configuration (vite.config.js)**

If you use Vite in your Remix project, ensure environment variables are exposed correctly:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
});
```

4. **Server-side helper (utils/flagship.server.ts)**

Initialize and start Flagship SDK:

```ts
import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
} from "@flagship.io/react-sdk";

let flagshipInstance: Flagship | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function startFlagshipSDK(): Promise<Flagship> {
  if (
    flagshipInstance &&
    flagshipInstance.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return flagshipInstance;
  }

  const envId = requireEnv("FS_ENV_ID");
  const apiKey = requireEnv("FS_API_KEY");

  flagshipInstance = await Flagship.start(envId, apiKey, {
    fetchNow: false,
    decisionMode: DecisionMode.DECISION_API,
    logLevel: LogLevel.INFO,
  });

  return flagshipInstance;
}

export async function getFsVisitorData(visitorData: {
  id: string;
  hasConsented: boolean;
  context: Record<string, any>;
}) {
  const flagship = await startFlagshipSDK();

  const visitor = flagship.newVisitor({
    visitorId: visitorData.id,
    hasConsented: visitorData.hasConsented,
    context: visitorData.context,
  });

  await visitor.fetchFlags();
  return visitor;
}
```

5. **Using flags in your Remix loader (app/routes/index.tsx)**

Fetch flags and use them to load dynamic data on the server:

```ts
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getFsVisitorData } from "../utils/flagship.server";
import { v4 as uuidv4 } from "uuid";

export const loader: LoaderFunction = async ({ request }) => {
  const visitorId = uuidv4();

  const visitor = await getFsVisitorData({
    id: visitorId,
    hasConsented: true,
    context: {
      Session: "Returning",
      INTERNET_CONNECTION: "5g",
      fs_orders: 3,
      fs_authenticated: true,
    },
  });

  const flag = visitor.getFlag("flagProductRecs");
  const flagValue = flag?.getValue("default_strategy_id");

  // Use flagValue to fetch recommendations from API...

  return json({ flagValue /*, other data */ });
};

export default function Index() {
  const { flagValue } = useLoaderData();
  return <div>Flag value: {flagValue}</div>;
}
```

---

## 📦 Installation

1. **Clone the repository**

```bash
git clone https://github.com/valoudefou/ssr-feature-flag-remix-run.git
cd ssr-feature-flag-remix-run
```

2. **Install dependencies**

```bash
npm install
```

3. **Start dev server**

```bash
npm run dev
```

---

## Further Reading

- [Flagship.io React SDK Documentation](https://flagship.io/docs/sdk/react)
- [Remix Run Official Docs](https://remix.run/docs/en/stable)
- [Improving Core Web Vitals](https://web.dev/vitals/)
- [AB Tasty Recommendations API](https://docs.abtasty.com/recommendations)

---

## Conclusion

This approach integrates feature flags directly in Remix server loaders using the Flagship SDK, improving performance and UX by avoiding client-only fetches. It ensures consistency between server and client renders and enhances your app’s Core Web Vitals and Lighthouse metrics.

---

## License

MIT © AB Tasty
