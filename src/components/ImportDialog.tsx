import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importLeads } from "@/services/leads";
import type { ImportResult, Source } from "@/services/types";

type State = { s: "loading" } | { s: "done"; r: ImportResult } | { s: "error" };

export default function ImportDialog({ sources, onClose }: { sources: Source[]; onClose: (changed: boolean) => void }) {
  const [state, setState] = useState<State>({ s: "loading" });

  const run = useCallback(() => {
    setState({ s: "loading" });
    importLeads(sources)
      .then((r) => setState({ s: "done", r }))
      .catch(() => setState({ s: "error" }));
  }, [sources]);

  useEffect(run, [run]);

  const changed = state.s === "done" && state.r.imported > 0;
  const from = sources.length === 2 ? "Facebook and Instagram" : sources[0] === "facebook" ? "Facebook" : "Instagram";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f2540]/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        {state.s === "loading" && (
          <>
            <Loader2 className="mx-auto mb-3 animate-spin text-primary" size={28} />
            <h2 className="font-semibold">Importing leads...</h2>
            <p className="mt-1 text-xs text-muted">Fetching new leads from {from}.</p>
          </>
        )}
        {state.s === "done" && state.r.imported === 0 && (
          <>
            <Info className="mx-auto mb-3 text-muted" size={28} />
            <h2 className="font-semibold">No new leads found.</h2>
            {state.r.duplicates > 0 && <p className="mt-1 text-xs text-muted">{state.r.duplicates} duplicate leads skipped</p>}
          </>
        )}
        {state.s === "done" && state.r.imported > 0 && (
          <>
            <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={28} />
            <h2 className="font-semibold">Import completed</h2>
            <p className="mt-1 text-xs text-muted">{state.r.imported} new leads imported</p>
            <p className="text-xs text-muted">{state.r.duplicates} duplicate leads skipped</p>
          </>
        )}
        {state.s === "error" && (
          <>
            <AlertCircle className="mx-auto mb-3 text-red-500" size={28} />
            <h2 className="font-semibold">Unable to import leads.</h2>
          </>
        )}
        {state.s !== "loading" && (
          <div className="mt-5 flex justify-center gap-2">
            {state.s === "error" && <Button onClick={run}>Try Again</Button>}
            <Button variant={state.s === "error" ? "outline" : "default"} onClick={() => onClose(changed)}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
