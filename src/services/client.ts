import type { Lead, Source } from "./types";

/**
 * Fetches leads from a safe, secret-free endpoint (your backend / webhook service).
 * Expected response: Lead[] or { leads: Lead[] }. Extra fields are kept as-is.
 * Adapt `normalize` if your API returns a different shape.
 */
export async function fetchLeads(url: string, source: Source): Promise<Lead[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(data) ? data : data.leads ?? [];
  return list.map((r) => normalize(r, source));
}

function normalize(r: Record<string, unknown>, source: Source): Lead {
  return {
    ...r,
    id: String(r.id ?? r.lead_id ?? ""),
    name: String(r.name ?? r.full_name ?? "Unknown"),
    email: r.email as string | undefined,
    phone: (r.phone ?? r.phone_number) as string | undefined,
    formName: (r.formName ?? r.form_name) as string | undefined,
    createdAt: String(r.createdAt ?? r.created_time ?? new Date().toISOString()),
    source,
  };
}
