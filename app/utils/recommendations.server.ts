// utils/recommendations.server.ts

export const SITE_ID = 1031;
export const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaXRlX2lkIjoxMDMxLCJpYXQiOjE3NDYyMDIyNjAsImp0aSI6ImxELWlKVmtaVnZlOVVkYk5tVzZfcXJXN3ExaUpQM3pPRzYN...";
export const RECOMMENDATION_ID = "2e2c9992-2c5d-466a-bded-71cb2a059730";

export type Product = {
  id: string;
  name: string;
  img_link: string;
  price: number | string;
  revenues_last_30_days?: number;
};

export type Recommendation = {
  name: string;
  items: Product[];
};

export async function fetchRecommendations(): Promise<Recommendation> {
  const query = JSON.stringify({ viewing_item: "456" });
  const fields = JSON.stringify(["id", "name", "img_link", "price"]);

  const res = await fetch(
    `https://uc-info.eu.abtasty.com/v1/reco/${SITE_ID}/recos/${RECOMMENDATION_ID}?variables=${query}&fields=${fields}`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch recommendations");

  return await res.json();
}
