// app/routes/index.tsx

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getFsVisitorData, getFsVisitorData2 } from "../utils/flagship.server";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Type definitions for product and loader data
interface Product {
  id: string;
  name: string;
  img_link: string;
  price: string | number | null;
}

interface LoaderData {
  products: Product[];
  flagValue?: string;
  customAccountValue: string | null; // <-- add this
  blockName: string;
  visitorId: string;
  flagKey: string;
  userContext: Record<string, any>;
  logs: string[]; // add this
}


// Loader function to fetch data for the page
export const loader: LoaderFunction = async ({ request }) => {
  const logs: string[] = [];

  try {
    logs.push("[Loader][Info] Parsing URL and getting custom flagValue");
    const url = new URL(request.url);
    const customFlagValue = url.searchParams.get("flagValue") || undefined;
    const customAccountValue = String(url.searchParams.get("accountValue") ?? "");

    const visitorId = uuidv4();
    logs.push(`[Loader][Info] Generated visitorId: ${visitorId}`);

    if (!process.env.SITE_ID || !process.env.RECS_BEARER) {
      logs.push("[Loader][Info] Missing SITE_ID or RECS_BEARER environment variables");
      throw new Error("Missing SITE_ID or RECS_BEARER environment variables");
    }
    logs.push("[Loader][Info] Environment variables verified");
    
    const accountLoaders = {
      "account-1": {
        loader: getFsVisitorData,
        log: "[Loader][Info] Using singleton Flagship instance for account-1",
      },
      "account-2": {
        loader: getFsVisitorData2,
        log: "[Loader][Info] Using fresh Flagship instance for account-2",
      },
    };

    const accountKey = customAccountValue === "account-2" ? "account-2" : "account-1";
    const { loader, log } = accountLoaders[accountKey];

    logs.push(log);

    const visitor = await loader({
      id: visitorId,
      hasConsented: true,
      context: {
        Session: "Returning",
      },
    });

    logs.push(`[Loader][Info] Reading user context: ${visitor.context ? JSON.stringify(visitor.context) : "No context available"}`);
    logs.push("[Loader][Info] Fetching Flagship visitor data");
    logs.push("[Loader][Info] Visitor data fetched");

    const flag = visitor.getFlag("flagProductRecs");
    const fallbackFlagValue = flag?.getValue("07275641-4a2e-49b2-aa5d-bb4b7b8b2a4c");
    const flagValue = customFlagValue || fallbackFlagValue;
    const flagKey = (flag as any)?._key || "unknown";

    logs.push(`[Loader][Info] Flag key fetched: ${flagKey}`);
    logs.push(`[Loader][Info] Using flagValue: ${flagValue}`);
    logs.push(`[Loader][Info] Campaign type: ${JSON.stringify(flag.metadata.campaignType)}`);
    logs.push(`[Loader][Info] Campaign mame: ${JSON.stringify(flag.metadata.campaignName)}`);
    logs.push(`[Loader][Info] CampaignId: ${JSON.stringify(flag.metadata.campaignId)}`);

    const query = JSON.stringify({ viewing_item: "456" });
    const fields = JSON.stringify(["id", "name", "img_link", "price"]);

    let products: Product[] = [];
    let blockName = "";

    if (flagValue) {
      try {
        logs.push(`[Loader][Info] Fetching recommendations for flagValue ${flagValue}`);
        const recoUrl = `https://uc-info.eu.abtasty.com/v1/reco/${process.env.SITE_ID}/recos/${flagValue}?variables=${encodeURIComponent(
          query
        )}&fields=${encodeURIComponent(fields)}`;

        const res = await fetch(recoUrl, {
          headers: {
            Authorization: `Bearer ${process.env.RECS_BEARER}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          logs.push(`[Loader][Info] Failed to fetch recommendations: ${res.status} ${res.statusText} - ${errorText}`);
          blockName = "Our Top Picks For You";
        } else {
          const data = await res.json();
          products = data.items || [];
          blockName = data.name || "Our Top Picks For You";
          logs.push(`[Loader][Info] Recommendations fetched: ${products.length}`);
          logs.push(`[Loader][Info] Block name: ${blockName}`);
          logs.push(`[Loader][Info] URL params in use: ${url}`);
        }
      } catch (err) {
        logs.push(`[Loader][Info] Recommendation API fetch error: ${String(err)}`);
        blockName = "Our Top Picks For You";
      }
    } else {
      logs.push("[Loader][Info] No flagValue provided, using default block name");
      blockName = "Our Top Picks For You";
    }

    return json<LoaderData>({
      products,
      flagValue,
      blockName,
      visitorId,
      customAccountValue,
      flagKey,
      userContext: visitor.context,
      logs,
    });
  } catch (error) {
    logs.push(`[Loader] Loader error: ${String(error)}`);
    return json<LoaderData>({
      products: [],
      flagValue: undefined,
      blockName: "Our Top Picks For You",
      visitorId: "",
      flagKey: "",
      customAccountValue: null,
      userContext: {},
      logs,
    });
  }
};


// Main React component for the page
export default function Index() {

  // Get loader data
  const { products, flagValue, blockName, logs, customAccountValue } = useLoaderData<LoaderData>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState(customAccountValue || undefined);
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    if (customAccountValue) {
      setAccount(customAccountValue);
      console.log(account);
    }
  }, [customAccountValue]);


  // State for carousel scroll buttons
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll button state based on carousel position
  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // Update scroll buttons on mount and when products change
  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [products]);

  const cleanPrice = (price: string | number | null) => {
    if (price == null) return "";

    // Convert string to number safely, stripping non-numeric characters
    const num = typeof price === "string"
      ? parseFloat(price.replace(/[^\d.-]/g, ""))
      : price;

    if (isNaN(num)) return "";

    // Format with up to 2 decimals, no trailing .00 if unnecessary
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Recommendations Block */}
      <section aria-label="Product recommendations" className="p-8 py-10 flex flex-col">



        <h1 className="py-4 px-4 text-3xl font-bold mb-4 text-gray-900">{blockName}</h1>

        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-full w-12 z-20 bg-gradient-to-r from-gray-50 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-full w-12 z-20 bg-gradient-to-l from-gray-50 to-transparent"
          />

          {/* Scroll buttons */}
          <button
            type="button"
            onClick={() => carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 shadow-md transition hover:bg-gray-100 hover:scale-110 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 shadow-md transition hover:bg-gray-100 hover:scale-110 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel */}
          <div
            ref={carouselRef}
            onScroll={updateScrollButtons}
            className="overflow-x-auto scroll-smooth pr-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", whiteSpace: "nowrap" }}
            tabIndex={0}
            aria-label="Product carousel"
          >
            {/* Show message if no products */}
            {products.length === 0 && <p className="p-4 text-gray-500">No recommendations available at the moment.</p>}
            {/* Render each product as a card */}
            {products.map((product: Product) => (
              <article
                onClick={() => {
                  logs.push(`[Loader][Info] Data sent to analytics for product ID: ${product.id}, Name: ${product.name}`);
                }}
                key={product.id}
                className="group inline-block min-w-[220px] max-w-[240px] bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 mx-3 align-top cursor-pointer overflow-hidden"
              >
                {/* Image container with loading state */}
                <div className="relative w-full h-40 bg-gray-50 rounded-t-xl overflow-hidden">
                  <img
                    src={product.img_link}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    width={240}
                    height={160}
                    decoding="async"
                    {...{ fetchpriority: "low" }}
                  />

                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-2">
                  <h2 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                    {product.name}
                  </h2>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      ${cleanPrice(product.price)}
                    </p>

                    {/* Subtle action indicator */}
                    <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors duration-200">
                      <svg
                        className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </article>
            ))}

          </div>
        </div>



        {/* Debug info block */}
        <div className="flex-grow mt-8 mx-4 mb-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">
                Server Debug Info
              </h3>
              <div className="ml-auto text-xs text-gray-400 font-mono">
                {logs.length} entries
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
              <div className="p-4 space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="group relative px-3 py-2 text-sm font-mono text-green-300 bg-gray-800/30 hover:bg-gray-800/50 rounded-md border border-transparent hover:border-gray-700/50 transition-all duration-150 select-text"
                  >
                    <div className="absolute left-1 top-2 w-1 h-4 bg-green-400/30 rounded-full group-hover:bg-green-400/50 transition-colors"></div>
                    <div className="pl-4 whitespace-pre-wrap break-all">
                      {log}
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">No debug logs yet</p>
                      <p className="text-xs text-gray-600 mt-1">Logs will appear here as they're generated</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fade overlay for better UX when scrolling */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none"></div>
          </div>
        </div>



        {/* Floating bottom-right form for changing flag value */}
        <div className="fixed bottom-6 right-6 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-6 z-50 transition-all duration-200 hover:shadow-2xl">
          {showTextInput ? (
            <form method="get" className="space-y-4">
              {/* Account Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Account
                </label>
                <select
                  name="accountValue"
                  defaultValue={customAccountValue ?? ""}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="account-1">Account 1</option>
                  <option value="account-2">Account 2</option>
                </select>
              </div>

              {/* Manual Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  AB Tasty Reco ID
                </label>
                <input
                  name="flagValue"
                  defaultValue="2e2c9992-2c5d-466a-bded-71cb2a059730"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono"
                  placeholder="Enter custom ID..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150"
                >
                  ← Back to presets
                </button>
              </div>
            </form>
          ) : (
            <form method="get" className="space-y-4">
              {/* Account Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Account
                </label>
                <select
                  name="accountValue"
                  defaultValue={customAccountValue ?? ""}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="account-1">Account 1</option>
                  <option value="account-2">Account 2</option>
                </select>
              </div>

              {/* Preset Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  AB Tasty Reco ID
                </label>
                <select
                  name="flagValue"
                  defaultValue={flagValue ?? ""}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono"
                >
                  <option value="9174ac6d-6b74-4234-b412-7d2d0d4acdad">
                    9174ac6d...4acdad
                  </option>
                  <option value="b7c76816-dcf3-4c0c-9023-a80a3a348151">
                    b7c76816...348151
                  </option>
                  <option value="b24cc1cb-bf79-4784-b23b-0a66b3593509">
                    b24cc1cb...593509
                  </option>
                  <option value="e5570bbc-9f91-48ec-b0ec-5d6ab941e402">
                    e5570bbc...41e402
                  </option>
                  <option value="875bb146-4a9c-4e26-ab67-02b2ccb87ca1">
                    875bb146...cb87ca1
                  </option>
                  <option value="07275641-4a2e-49b2-aa5d-bb4b7b8b2a4c">
                    07275641...8b2a4c
                  </option>
                  <option value="2e2c9992-2c5d-466a-bded-71cb2a059730">
                    2e2c9992...059730
                  </option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowTextInput(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150"
                >
                  Custom ID →
                </button>
              </div>
            </form>
          )}
        </div>



      </section>
    </main>
  );
}