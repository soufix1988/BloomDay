import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Bloom's signature pop card — soft card with thick border & offset shadow. */
export function PopCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("bg-card rounded-3xl border-pop p-5 sm:p-6", className)} style={style}>
      {children}
    </div>
  );
}

export function SoftCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-3xl shadow-soft border border-secondary p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
