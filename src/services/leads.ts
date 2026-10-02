import { fetchLeads } from "./client";
import { getFacebookLeads } from "./facebook";
import { getInstagramLeads } from "./instagram";
import type { ImportResult, IntegrationStatus, Lead, Source } from "./types";

const SEEN = "synced-lead-ids";

// React Strict Mode runs the import effect twice in dev. Share one in-flight result
// so a single click is not counted as a duplicate of itself.
let recentImport: { key: string; at: number; promise: Promise<ImportResult> } | null = null;

/** Live leads stored by the Meta webhook server. */
export async function getLeads(): Promise<Lead[]> {
  return fetchLeads("/api/leads", "facebook");
}

function dedupe(leads: Lead[]) {
  const seen = new Set<string>();
  return leads.filter((l) => (l.id && seen.has(l.id) ? false : (seen.add(l.id), true)));
}

export function importLeads(sources: Source[] = ["facebook", "instagram"]): Promise<ImportResult> {
  const key = [...sources].sort().join(",");
  if (recentImport && recentImport.key === key && Date.now() - recentImport.at < 1500) {
    return recentImport.promise;
  }
  const promise = runImport(sources);
  recentImport = { key, at: Date.now(), promise };
  return promise;
}

async function runImport(sources: Source[]): Promise<ImportResult> {
  const fetched = (
    await Promise.all(sources.map((s) => (s === "facebook" ? getFacebookLeads() : getInstagramLeads())))
  ).flat();
  const unique = dedupe(fetched);
  let seen = new Set<string>();
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN) ?? "[]");
    if (Array.isArray(raw)) seen = new Set(raw.map(String));
  } catch {}
  const fresh = unique.filter((l) => l.id && !seen.has(l.id));
  unique.forEach((l) => l.id && seen.add(l.id));
  try {
    localStorage.setItem(SEEN, JSON.stringify([...seen]));
  } catch {}
  return { imported: fresh.length, duplicates: unique.length - fresh.length };
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
