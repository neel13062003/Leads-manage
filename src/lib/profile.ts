export interface Profile {
  name: string;
  email: string;
  phone: string;
  company: string;
}

const KEY = "profile";
const defaults: Profile = { name: "Admin", email: "", phone: "", company: "Throughout Hill Immigration" };

export function loadProfile(): Profile {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "U";
