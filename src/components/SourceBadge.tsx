import { Facebook, Instagram } from "@/components/BrandIcons";
import type { Source } from "@/services/types";
import { cn } from "@/lib/utils";

export function SourceBadge({ source }: { source: Source }) {
  const fb = source === "facebook";
  const Icon = fb ? Facebook : Instagram;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        fb ? "bg-[#e7efff] text-[#2f6df6]" : "bg-[#fdebf3] text-[#d6336c]",
      )}
    >
      <Icon size={12} />
      {fb ? "Facebook" : "Instagram"}
    </span>
  );
}
