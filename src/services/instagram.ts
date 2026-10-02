import { fetchLeads } from "./client";
import type { Lead } from "./types";

/** Built-in Meta webhook. Override with VITE_INSTAGRAM_LEADS_API only for a different backend. */
export const INSTAGRAM_API =
  (import.meta.env.VITE_INSTAGRAM_LEADS_API as string | undefined) || "/api/leads?source=instagram";

export async function getInstagramLeads(): Promise<Lead[]> {
  return fetchLeads(INSTAGRAM_API, "instagram");
}
