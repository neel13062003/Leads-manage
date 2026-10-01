import type { Lead, Source } from "./types";

const names = [
  "Rahul Sharma", "Priya Reddy", "Arjun Kumar", "Sneha Patil", "Vikram Singh", "Ananya Iyer",
  "Karan Mehta", "Neha Gupta", "Rohan Das", "Pooja Nair", "Aditya Rao", "Meera Joshi",
  "Siddharth Jain", "Isha Kapoor", "Manish Verma", "Divya Menon", "Nikhil Shah", "Kavya Pillai",
];
const forms = ["ERP Enquiry Form", "Demo Request", "Pricing Enquiry", "Free Trial Signup"];

function make(i: number, source: Source): Lead {
  const name = names[i % names.length];
  const slug = name.toLowerCase().replace(" ", ".");
  return {
    id: `${source.slice(0, 2)}_${1000 + i}`,
    name,
    email: `${slug}@example.com`,
    phone: `+91 9${String(100000000 + i * 7919331).slice(0, 4)} ${String(10000 + i * 137).slice(0, 5)}`,
    source,
    formName: forms[i % forms.length],
    createdAt: new Date(Date.now() - i * 3.3 * 3600_000).toISOString(),
  };
}

// MOCK DATA ONLY — replaced by real endpoints when VITE_*_LEADS_API is set.
export const mockLeads = (source: Source, count: number): Lead[] =>
  Array.from({ length: count }, (_, i) => make(source === "facebook" ? i * 2 : i * 2 + 1, source));

export const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));
