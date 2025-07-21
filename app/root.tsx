import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import "../types/globals.d.ts";

import "./tailwind.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || "G-983490BZWX";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "Remix Feature Flag" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { name: "description", content: "An app to demonstrate AB Tasty feature flags in SSR Remix + Vite" },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {/* Google Analytics 4 script */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          crossOrigin="anonymous"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
   gtag('config', '${GA_MEASUREMENT_ID}', {
        debug_mode: true
      });
            `,
          }}
        />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
