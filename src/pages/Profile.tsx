import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initials, type Profile } from "@/lib/profile";

const fields: [keyof Profile, string, string][] = [
  ["name", "Full name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "tel"],
  ["company", "Company", "text"],
];

export default function ProfilePage({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-xs text-muted">Manage your account details</p>
      </div>
      <form
        className="max-w-xl rounded-xl bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) return;
          onSave({ ...form, name: form.name.trim() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-xl font-semibold text-primary">
            {initials(form.name)}
          </span>
          <div>
            <div className="font-semibold">{form.name || "—"}</div>
            <div className="text-xs text-muted">{form.company}</div>
          </div>
        </div>
        <div className="space-y-4">
          {fields.map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs text-muted">{label}</span>
              <Input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={!dirty || !form.name.trim()}>
            Save changes
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
