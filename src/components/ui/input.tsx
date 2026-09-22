import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full border-2 border-border bg-bg px-3 font-sans text-base text-fg",
          "placeholder:text-muted",
          "focus-visible:border-accent focus-visible:outline-none",
          "disabled:opacity-40",
          className,
        )}
        {...props}
      />
    );
  },
);
