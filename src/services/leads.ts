import { FACEBOOK_API, getFacebookLeads } from "./facebook";
import { INSTAGRAM_API, getInstagramLeads } from "./instagram";
import { delay, mockLeads } from "./mock";
import type { ImportResult, Lead, Source, SourceStatus } from "./types";

/**
 * Local store of imported leads (localStorage). If your backend already stores
 * and de-duplicates leads, swap getLeads() for a call to it and drop this store.
 */
const KEY = "imported-leads";
const META = "source-last-received";
const usingMock = !FACEBOOK_API && !INSTAGRAM_API;

function read(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Demo seed: the first few mock leads are already imported
  return usingMock ? [...mockLeads("facebook", 6), ...mockLeads("instagram", 5)] : [];
}

function write(leads: Lead[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(leads));
  } catch {}
}

export async function getLeads(): Promise<Lead[]> {
  if (usingMock) await delay(400);
  return dedupe(read()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function dedupe(leads: Lead[]) {
  const seen = new Set<string>();
  return leads.filter((l) => (l.id && seen.has(l.id) ? false : (seen.add(l.id), true)));
}

export async function importLeads(sources: Source[] = ["facebook", "instagram"]): Promise<ImportResult> {
  const fetched = (
    await Promise.all(
      sources.map((s) => (s === "facebook" ? getFacebookLeads() : getInstagramLeads())),
    )
  ).flat();
  const existing = read();
  const known = new Set(existing.map((l) => l.id));
  const fresh = dedupe(fetched).filter((l) => !known.has(l.id));
  write([...fresh, ...existing]);
  const now = new Date().toISOString();
  try {
    const meta = JSON.parse(localStorage.getItem(META) ?? "{}");
    sources.forEach((s) => (meta[s] = now));
    localStorage.setItem(META, JSON.stringify(meta));
  } catch {}
  return { imported: fresh.length, duplicates: fetched.length - fresh.length };
}

export function getSourceStatus(source: Source): SourceStatus {
  let last: string | null = null;
  try {
    last = JSON.parse(localStorage.getItem(META) ?? "{}")[source] ?? null;
  } catch {}
  const configured = Boolean(source === "facebook" ? FACEBOOK_API : INSTAGRAM_API);
  return { configured, lastReceived: last ?? (usingMock ? new Date(Date.now() - 2 * 60000).toISOString() : null) };
}

export const isMockMode = usingMock;
