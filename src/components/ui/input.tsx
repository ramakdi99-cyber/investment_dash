import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-ink-line bg-white px-3 text-sm text-ink shadow-[0_1px_1px_rgba(11,13,18,0.02)] transition-colors",
        "placeholder:text-ink-subtle",
        "hover:border-ink-line disabled:cursor-not-allowed disabled:bg-ink-wash disabled:opacity-60",
        "focus-visible:border-cobalt/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full resize-y rounded-lg border border-ink-line bg-white px-3 py-2 text-sm leading-6 text-ink transition-colors",
        "placeholder:text-ink-subtle hover:border-ink-line",
        "focus-visible:border-cobalt/40",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
