import { FACEBOOK_API } from "@/services/facebook";
import { INSTAGRAM_API } from "@/services/instagram";

const rows = [
  ["Facebook leads API", "VITE_FACEBOOK_LEADS_API", FACEBOOK_API],
  ["Instagram leads API", "VITE_INSTAGRAM_LEADS_API", INSTAGRAM_API],
] as const;

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-xs text-muted">Lead source configuration</p>
      </div>
      <div className="divide-y divide-line rounded-xl border border-line bg-white">
        {rows.map(([label, env, val]) => (
          <div key={env} className="p-5">
            <div className="font-medium">{label}</div>
            <div className="mt-1 text-xs text-muted">
              Set <code className="rounded bg-slate-100 px-1.5 py-0.5">{env}</code> in <code>.env</code>
            </div>
            <div className="mt-2 text-xs">{val ? "Configured" : "Not configured (using mock data)"}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Only safe, secret-free endpoints belong here. Meta tokens must stay on your server.
      </p>
    </div>
  );
}
