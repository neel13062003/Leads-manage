import { fetchLeads } from "./client";
import type { Lead } from "./types";

/** Built-in Meta webhook. Override with VITE_FACEBOOK_LEADS_API only for a different backend. */
export const FACEBOOK_API =
  (import.meta.env.VITE_FACEBOOK_LEADS_API as string | undefined) || "/api/leads?source=facebook";

export async function getFacebookLeads(): Promise<Lead[]> {
  return fetchLeads(FACEBOOK_API, "facebook");
}
