import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { EpisodeEditorForm } from "@/components/admin/EpisodeEditorForm";
import {
  isEpisodesDbReady,
  listEventsForEpisodeLink,
} from "@/lib/episodes";

export const metadata: Metadata = { title: "Admin · New episode" };

async function EpisodeEditor() {
  const events = await listEventsForEpisodeLink();

  return <EpisodeEditorForm events={events} />;
}

export default function AdminNewEpisodePage() {
  if (!isEpisodesDbReady()) redirect("/admin/show");

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        New episode
      </h1>
      <p className="mt-2 text-mute">
        Create a DataBrew draft, then publish when the embed is ready.
      </p>
      <div className="mt-10 max-w-3xl">
        <Suspense
          fallback={
            <p className="text-sm text-mute" role="status">
              Loading episode form…
            </p>
          }
        >
          <EpisodeEditor />
        </Suspense>
      </div>
    </Container>
  );
}
