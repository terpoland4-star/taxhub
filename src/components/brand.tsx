import { cn } from "@/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tracking-tight", className)}>
      <span className="font-display text-[1.15em] font-medium text-fg">NigerTax</span>
      <span className="text-[0.72em] font-semibold uppercase tracking-[0.18em] text-accent">
        Pro
      </span>
    </span>
  );
}

export function Seal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="34" height="34" rx="9" fill="currentColor" />
      <path
        d="M12 22.5c0-5 3.6-8.5 8-8.5s8 3.5 8 8.5"
        fill="none"
        stroke="var(--color-accent-fg)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="16.5" r="1.6" fill="var(--color-accent-fg)" />
      <path
        d="M14 25.5h12"
        stroke="var(--color-accent-fg)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
