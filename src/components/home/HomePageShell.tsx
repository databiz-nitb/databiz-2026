"use client";

import type { ReactNode } from "react";
import { NetworkFieldLazy } from "@/components/three/NetworkFieldLazy";

export function HomePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 z-0 h-[min(100svh,56rem)] w-full max-w-3xl opacity-90 md:opacity-100"
      >
        <NetworkFieldLazy />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
