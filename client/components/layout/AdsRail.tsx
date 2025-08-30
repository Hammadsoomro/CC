import React from "react";

interface AdsRailProps {
  position: "left" | "right";
  className?: string;
}

export function AdsRail({ position, className }: AdsRailProps) {
  return (
    <aside
      aria-label={`${position} ad rail`}
      data-ads-position={position}
      className={[
        "hidden xl:flex w-40 shrink-0 items-start justify-center p-2",
        position === "left" ? "order-first" : "order-last",
        className ?? "",
      ].join(" ")}
    >
      <div
        className="w-full h-[600px] rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground"
        data-ads-container
      >
        Ad Space
      </div>
    </aside>
  );
}
