import { Download } from "lucide-react";
import { Facebook, Instagram } from "@/components/BrandIcons";
import { Button } from "@/components/ui/button";
import { getSourceStatus, isMockMode } from "@/services/leads";
import type { Source } from "@/services/types";
import { cn, timeAgo } from "@/lib/utils";

const cards: { id: Source; name: string; Icon: typeof Facebook; tint: string }[] = [
  { id: "facebook", name: "Facebook", Icon: Facebook, tint: "bg-[#e7efff] text-[#2f6df6]" },
  { id: "instagram", name: "Instagram", Icon: Instagram, tint: "bg-[#fdebf3] text-[#d6336c]" },
];

export default function ImportPage({ onImport }: { onImport: (s: Source[]) => void }) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Import Leads</h1>
        <p className="text-xs text-muted">Bring Facebook and Instagram leads into your CRM.</p>
      </div>
      {isMockMode && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Showing mock data. Set VITE_FACEBOOK_LEADS_API / VITE_INSTAGRAM_LEADS_API in .env to connect your real sources.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ id, name, Icon, tint }) => {
          const st = getSourceStatus(id);
          const canImport = st.configured || isMockMode;
          return (
            <div key={id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tint)}>
                  <Icon size={18} />
                </span>
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-muted">Lead webhook</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={cn("h-2 w-2 rounded-full", st.configured ? "bg-emerald-500" : "bg-slate-300")} />
                {st.configured ? "Connected" : isMockMode ? "Mock data" : "Not configured"}
              </div>
              <div className="mt-3 text-xs text-muted">Last received:</div>
              <div className="mb-4 text-[13px] font-medium">{timeAgo(st.lastReceived)}</div>
              <Button className="w-full" disabled={!canImport} onClick={() => onImport([id])}>
                <Download size={15} /> Import Leads
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
