import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px] outline-none placeholder:text-muted focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
