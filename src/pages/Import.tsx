import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Facebook, Instagram } from "@/components/BrandIcons";
import { Button } from "@/components/ui/button";
import { getIntegrationStatus } from "@/services/leads";
import type { IntegrationStatus, Source, SourceStatus } from "@/services/types";
import { cn, timeAgo } from "@/lib/utils";

const cards: { id: Source; name: string; Icon: typeof Facebook; tint: string }[] = [
  { id: "facebook", name: "Facebook", Icon: Facebook, tint: "bg-[#e7efff] text-[#2f6df6]" },
  { id: "instagram", name: "Instagram", Icon: Instagram, tint: "bg-[#fdebf3] text-[#d6336c]" },
];

const empty: SourceStatus = { configured: false, lastReceived: null };

export default function ImportPage({ onImport }: { onImport: (s: Source[]) => void }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    getIntegrationStatus()
      .then((next) => {
        setStatus(next);
        setOffline(false);
      })
      .catch(() => setOffline(true));
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Import Leads</h1>
        <p className="text-xs text-muted">Facebook and Instagram Lead Ads received by the Meta webhook.</p>
      </div>
      {offline && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Webhook server is not running. Start it with npm run server.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ id, name, Icon, tint }) => {
          const st = status?.sources[id] ?? empty;
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
                {st.configured ? "Connected" : offline ? "Server offline" : "Not configured"}
              </div>
              <div className="mt-3 text-xs text-muted">Last received:</div>
              <div className="mb-4 text-[13px] font-medium">{timeAgo(st.lastReceived)}</div>
              <Button className="w-full" disabled={!st.configured} onClick={() => onImport([id])}>
                <Download size={15} /> Import Leads
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
