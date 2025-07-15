// app/routes/index.tsx

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getFsVisitorData } from "../utils/flagship.server";
import React, { useEffect, useRef, useState } from "react";
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

    const visitorId = uuidv4();
    logs.push(`[Loader][Info] Generated visitorId: ${visitorId}`);

    if (!process.env.SITE_ID || !process.env.RECS_BEARER) {
      logs.push("[Loader][Info] Missing SITE_ID or RECS_BEARER environment variables");
      throw new Error("Missing SITE_ID or RECS_BEARER environment variables");
    }
    logs.push("[Loader][Info] Environment variables verified");

    const visitor = await getFsVisitorData({
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
      userContext: {},
      logs,
    });
  }
};


// Main React component for the page
export default function Index() {

  const [showTextInput, setShowTextInput] = useState(false);
  // Get loader data
  const { products, flagValue, blockName, logs } = useLoaderData<LoaderData>();
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Utility to clean up price formatting
  const cleanPrice = (price: string | number | null) => {
    if (price == null) return "";
    return String(price).replace(/â‚¬/g, "€");
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
                  logs.push(`[Loader] Data sent to analytics for product ID: ${product.id}, Name: ${product.name}`);
                }}
                key={product.id}
                className="inline-block min-w-[220px] max-w-[240px] bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-300 mx-3 align-top"
                >
                <img
                  src={product.img_link}
                  alt={product.name}
                  className="w-full h-40 object-contain p-4"
                  loading="lazy"
                  width={240}
                  height={160}
                  decoding="async"
                  {...{ fetchpriority: "low" }}
                />
                <div className="px-4 pb-4">
                  <h2 className="text-base font-semibold truncate">{product.name}</h2>
                  <p className="text-gray-800 font-semibold text-lg mt-1">{cleanPrice(product.price)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Debug info block */}
<div className="flex-grow px-4 py-6 mt-10 pb-8 bg-[#0f2600] rounded-l shadow-inner font-mono text-sm text-green-400">
  <div className="px-1 mb-3 uppercase text-sm tracking-widest font-bold text-green-400 drop-shadow-[0_1px_1px_rgba(0,255,0,0.7)]">
    SERVER DEBUG INFO
  </div>
  <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-green-900">
    {logs.map((log, i) => (
      <div
        key={i}
        className="select-text whitespace-pre-wrap bg-[#112d00] px-1"
      >
        {log}
      </div>
    ))}
  </div>
</div>



 {/* Floating bottom-right form for changing flag value */}
    <div
      className="fixed bottom-4 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
      style={{ minWidth: "320px" }}
    >
      {showTextInput ? (
        <form method="get" className="space-y-2">
          <label className="block font-medium text-gray-700">
            Flag Reco Strategy:
            <input
              name="flagValue"
              defaultValue={flagValue}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type something..."
              style={{ padding: "8px", fontSize: "16px", marginTop: "4px" }}
            />
          </label>

          <div className="flex gap-2 items-center justify-between">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow hover:bg-blue-700 transition"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Back to list
            </button>
          </div>
        </form>
      ) : (
        <form method="get" className="space-y-2">
          <label className="block font-medium text-gray-700">
            Flag Reco Strategy:
            <select
              name="flagValue"
              defaultValue={flagValue}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="9174ac6d-6b74-4234-b412-7d2d0d4acdad">
                9174ac6d-6b74-4234-b412-7d2d0d4acdad
              </option>
              <option value="b7c76816-dcf3-4c0c-9023-a80a3a348151">
                b7c76816-dcf3-4c0c-9023-a80a3a348151
              </option>
              <option value="b24cc1cb-bf79-4784-b23b-0a66b3593509">
                b24cc1cb-bf79-4784-b23b-0a66b3593509
              </option>
              <option value="e5570bbc-9f91-48ec-b0ec-5d6ab941e402">
                e5570bbc-9f91-48ec-b0ec-5d6ab941e402
              </option>
              <option value="875bb146-4a9c-4e26-ab67-02b2ccb87ca1">
                875bb146-4a9c-4e26-ab67-02b2ccb87ca1
              </option>
              <option value="07275641-4a2e-49b2-aa5d-bb4b7b8b2a4c">
                07275641-4a2e-49b2-aa5d-bb4b7b8b2a4c
              </option>
              <option value="2e2c9992-2c5d-466a-bded-71cb2a059730">
                2e2c9992-2c5d-466a-bded-71cb2a059730
              </option>
            </select>
          </label>

          <div className="flex gap-2 items-center justify-between">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow hover:bg-blue-700 transition"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setShowTextInput(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Change manually
            </button>
          </div>
        </form>
      )}
    </div>

      
      </section>
    </main>
  );
}
