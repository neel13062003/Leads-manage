import { useEffect, useState } from "react";
import { getIntegrationStatus } from "@/services/leads";
import type { IntegrationStatus } from "@/services/types";
import { timeAgo } from "@/lib/utils";

export default function SettingsPage() {
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

  const rows: [string, string][] = [
    ["Webhook callback", status?.callbackPath ?? "/webhook"],
    ["Verify token", offline ? "Server offline" : status?.verifyToken ? "Configured" : "Missing in .env"],
    ["Graph API token", offline ? "Server offline" : status?.graphToken ? "Configured" : "Missing in .env"],
    ["Facebook last lead", timeAgo(status?.sources.facebook.lastReceived)],
    ["Instagram last lead", timeAgo(status?.sources.instagram.lastReceived)],
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-xs text-muted">Meta Lead Ads webhook</p>
      </div>
      <div className="divide-y divide-line rounded-xl border border-line bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 p-5">
            <div className="font-medium">{label}</div>
            <div className="text-xs text-muted">{value}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Point the Meta callback at <code className="rounded bg-slate-100 px-1.5 py-0.5">/webhook</code>. The verify
        token and Graph API token stay in the server <code>.env</code> file.
      </p>
    </div>
  );
}
