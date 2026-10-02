import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Download, Inbox, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { SourceBadge } from "@/components/SourceBadge";
import { getLeads } from "@/services/leads";
import type { Lead } from "@/services/types";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 8;
const filters = [
  ["all", "All"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
] as const;
const dates = [
  ["all", "Any time"],
  ["1", "Today"],
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
] as const;

export default function LeadsPage({ onImport }: { onImport: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<(typeof filters)[number][0]>("all");
  const [range, setRange] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getLeads()
      .then(setLeads)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [q, source, range]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
    return leads.filter(
      (l) =>
        (source === "all" || l.source === source) &&
        +new Date(l.createdAt) >= cutoff &&
        (!s || [l.name, l.email, l.phone, l.formName].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [leads, q, source, range]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const today = new Date().toDateString();
  const stats: [string, number, string][] = [
    ["Total leads", leads.length, "#2f6df6"],
    ["Facebook", leads.filter((l) => l.source === "facebook").length, "#1ab2f5"],
    ["Instagram", leads.filter((l) => l.source === "instagram").length, "#f5a623"],
    ["Received today", leads.filter((l) => new Date(l.createdAt).toDateString() === today).length, "#f26a2e"],
  ];
  const cell = "border-b border-line px-3 py-3";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-xs text-muted">All imported Facebook and Instagram leads</p>
        </div>
        <Button onClick={onImport}>
          <Download size={15} /> Import Leads
        </Button>
      </div>

      {!loading && !error && leads.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([label, value, color]) => (
            <div key={label} className="rounded-xl bg-white p-4 shadow-sm" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="text-xs text-muted">{label}</div>
              <div className="mt-1 text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 md:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Search leads..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {filters.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSource(id)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium",
                  source === id ? "bg-white text-primary shadow-sm" : "text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-9 rounded-lg border border-line bg-white px-3 text-xs outline-none"
          >
            {dates.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh" className="ml-auto">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        {error ? (
          <State icon={<AlertCircle className="text-red-500" />} title="Unable to load leads" action={<Button onClick={load}>Try Again</Button>} />
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <State
            icon={<Inbox className="text-muted" />}
            title="No leads yet"
            text="New Facebook and Instagram Lead Ads will show up here when Meta sends them to the webhook."
            action={<Button onClick={onImport}>Import Leads</Button>}
          />
        ) : filtered.length === 0 ? (
          <State icon={<Search className="text-muted" />} title="No matching leads" text="Try a different search or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="text-xs text-muted">
                    {["Name", "Email", "Phone", "Source", "Form", "Created At"].map((h) => (
                      <th key={h} className="border-b border-line px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-slate-50">
                      <td className={cn(cell, "font-medium")}>{l.name}</td>
                      <td className={cn(cell, "text-muted")}>{l.email ?? "—"}</td>
                      <td className={cn(cell, "text-muted")}>{l.phone ?? "—"}</td>
                      <td className={cell}>
                        <SourceBadge source={l.source} />
                      </td>
                      <td className={cn(cell, "text-muted")}>{l.formName ?? "—"}</td>
                      <td className={cn(cell, "text-muted")}>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <span>
                  {page} / {pages}
                </span>
                <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title="Lead Details">
        {selected && <Details lead={selected} onClose={() => setSelected(null)} />}
      </Sheet>
    </div>
  );
}

function State({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-xs text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 break-all font-medium">{children || "—"}</div>
    </div>
  );
}

function Details({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const known = ["id", "name", "email", "phone", "source", "formName", "createdAt"];
  const extra = Object.entries(lead).filter(([k, v]) => !known.includes(k) && ["string", "number"].includes(typeof v));
  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto">
        <Field label="Name">{lead.name}</Field>
        <Field label="Email">{lead.email}</Field>
        <Field label="Phone">{lead.phone}</Field>
        <Field label="Source">
          <SourceBadge source={lead.source} />
        </Field>
        <Field label="Form">{lead.formName}</Field>
        <Field label="Created">{formatDate(lead.createdAt)}</Field>
        <Field label="Lead ID">{lead.id}</Field>
        {extra.map(([k, v]) => (
          <Field key={k} label={k}>
            {String(v)}
          </Field>
        ))}
      </div>
      <Button variant="outline" onClick={onClose} className="mt-4 w-full">
        Close
      </Button>
    </>
  );
}
