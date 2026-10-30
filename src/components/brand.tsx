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
    <img
      src="/icon-180.png"
      alt="NigerTax Pro"
      className={cn("object-contain", className)}
    />
  );
}

/** Full logo (crest + wordmark) as a single image — for headers, login, etc. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <img
      src="/logo-header-320.png"
      alt="NigerTax Pro — La nouvelle signature de la clarté fiscale nigérienne"
      className={cn("object-contain", className)}
    />
  );
}
