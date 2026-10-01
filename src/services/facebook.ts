import { fetchLeads } from "./client";
import { delay, mockLeads } from "./mock";
import type { Lead } from "./types";

export const FACEBOOK_API = import.meta.env.VITE_FACEBOOK_LEADS_API as string | undefined;

/** Replace/extend this to plug in your real Facebook lead source. */
export async function getFacebookLeads(): Promise<Lead[]> {
  if (FACEBOOK_API) return fetchLeads(FACEBOOK_API, "facebook");
  await delay();
  return mockLeads("facebook", 12);
}
