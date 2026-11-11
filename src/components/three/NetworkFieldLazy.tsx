"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { NetworkFieldPlaceholder } from "./NetworkFieldPlaceholder";

const networkFieldImport = () =>
  import("./NetworkField").then((module) => module.NetworkField);

// Start the WebGL chunk as soon as this client module evaluates.
if (typeof window !== "undefined") {
  void import("./NetworkField");
}

const NetworkField = dynamic(networkFieldImport, {
  ssr: false,
  loading: () => <NetworkFieldPlaceholder />,
});

function subscribe() {
  return () => {};
}

function allowMotion() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "radial-gradient(circle at 70% 40%, var(--glow), transparent 45%)",
      }}
    />
  );
}

/** Skip WebGL when the visitor prefers reduced motion. */
export function NetworkFieldLazy() {
  const showField = useSyncExternalStore(subscribe, allowMotion, () => false);

  if (!showField) return fallback();

  return <NetworkField />;
}
