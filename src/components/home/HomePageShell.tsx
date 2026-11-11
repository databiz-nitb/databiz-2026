"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { HomePageLoader } from "./HomePageLoader";
import { NetworkFieldLazy } from "@/components/three/NetworkFieldLazy";

const MINIMUM_LOADER_DURATION_MS = 1200;

export function HomePageShell({ children }: { children: ReactNode }) {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowLoader(false),
      MINIMUM_LOADER_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 z-0 h-[min(100svh,56rem)] w-full max-w-3xl opacity-90 md:opacity-100"
      >
        <NetworkFieldLazy />
      </div>
      <div className="relative z-10">{children}</div>
      {showLoader ? (
        <div className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40">
          <HomePageLoader />
        </div>
      ) : null}
    </div>
  );
}
