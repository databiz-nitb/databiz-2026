"use client";

import { Spinner } from "@/components/ui/Spinner";

export function NetworkFieldPlaceholder() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Spinner
        label="Loading animated background"
        className="size-6 text-ember"
      />
    </div>
  );
}
