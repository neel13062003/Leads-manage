import { fetchLeads } from "./client";
import { delay, mockLeads } from "./mock";
import type { Lead } from "./types";

export const INSTAGRAM_API = import.meta.env.VITE_INSTAGRAM_LEADS_API as string | undefined;

/** Replace/extend this to plug in your real Instagram lead source. */
export async function getInstagramLeads(): Promise<Lead[]> {
  if (INSTAGRAM_API) return fetchLeads(INSTAGRAM_API, "instagram");
  await delay();
  return mockLeads("instagram", 12);
}
