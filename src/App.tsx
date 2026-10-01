import { useState } from "react";
import { Bell, ChevronDown, Download, Search, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import LeadsPage from "@/pages/Leads";
import ImportPage from "@/pages/Import";
import SettingsPage from "@/pages/Settings";
import ProfilePage from "@/pages/Profile";
import { initials, loadProfile, saveProfile } from "@/lib/profile";
import ImportDialog from "@/components/ImportDialog";
import type { Source } from "@/services/types";

type Page = "leads" | "import" | "settings" | "profile";

export default function App() {
  const [page, setPage] = useState<Page>("leads");
  const [importSources, setImportSources] = useState<Source[] | null>(null);
  const [version, setVersion] = useState(0);
  const [profile, setProfile] = useState(loadProfile);

  const startImport = (s: Source[] = ["facebook", "instagram"]) => setImportSources(s);

  const nav = (id: Page, label: string, Icon: typeof Users) => (
    <button
      onClick={() => setPage(id)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
        page === id ? "bg-primary text-white" : "text-muted hover:bg-slate-50",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden">

      <div className="relative flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col bg-white p-4 shadow-sm md:fixed md:inset-y-0 md:left-0 md:z-30 md:h-screen md:w-60 md:rounded-r-3xl">
          <div className="mb-6 flex justify-center pt-2">
            <img src="/logo.png" alt="Throughout Hill Immigration" className="h-24 w-24 rounded-full object-cover" />
          </div>
          <nav className="flex gap-1 md:flex-col">
            {nav("leads", "Leads", Users)}
            {nav("import", "Import", Download)}
          </nav>
          <div className="mt-auto hidden border-t border-line pt-3 md:block">{nav("settings", "Settings", Settings)}</div>
        </aside>

        <div className="min-w-0 flex-1 p-4 md:ml-60 md:px-8 md:py-5">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="relative hidden w-64 sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                placeholder="Search Anything..."
                className="h-9 w-full rounded-lg bg-white pl-9 pr-3 text-xs outline-none placeholder:text-muted"
              />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Bell size={16} className="text-muted" />
              <button
                onClick={() => setPage("profile")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white"
              >
                <span className="text-xs">Hi, {profile.name.split(" ")[0]}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {initials(profile.name)}
                </span>
                <ChevronDown size={14} className="text-muted" />
              </button>
            </div>
          </header>
          <main>
            {page === "leads" && <LeadsPage key={version} onImport={() => startImport()} />}
            {page === "import" && <ImportPage key={version} onImport={startImport} />}
            {page === "settings" && <SettingsPage />}
            {page === "profile" && (
              <ProfilePage
                profile={profile}
                onSave={(p) => {
                  saveProfile(p);
                  setProfile(p);
                }}
              />
            )}
          </main>
        </div>
      </div>

      {importSources && (
        <ImportDialog
          sources={importSources}
          onClose={(changed) => {
            setImportSources(null);
            if (changed) setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
