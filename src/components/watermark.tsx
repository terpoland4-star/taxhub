import { cn } from "@/lib/cn";

/**
 * Full-page watermark: fixed, centered, low-opacity crest behind content.
 * Drop it once near the top of a page's JSX — it doesn't affect layout flow
 * (absolute positioning, pointer-events disabled, sits behind via z-index).
 */
export function Watermark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-512.png"
      alt=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-1/2 top-1/2 -z-10 w-[60vw] max-w-[600px]",
        "-translate-x-1/2 -translate-y-1/2 opacity-[0.04] select-none",
        className,
      )}
    />
  );
}
