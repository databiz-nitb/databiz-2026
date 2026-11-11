import { site } from "@/content/site";

export function HomePageLoader() {
  return (
    <section
      className="field-wash relative z-10 flex min-h-[calc(100svh-var(--header-h))] items-center justify-center overflow-hidden border-b border-line px-6 py-20"
      style={{ backgroundColor: "var(--paper)" }}
      aria-busy="true"
      aria-label="Loading the DataBiz homepage"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-ember/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full blur-3xl"
        style={{ background: "var(--glow-mint)" }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="home-loader-network" aria-hidden>
          <svg
            viewBox="0 0 160 120"
            fill="none"
            className="absolute inset-0 size-full"
          >
            <path
              className="home-loader-path"
              d="M25 83 52 39l34 42 27-54 22 50M25 83l61-2 49-4M52 39l61-12M52 39l22 41"
            />
            <circle className="home-loader-node home-loader-node-a" cx="25" cy="83" r="4" />
            <circle className="home-loader-node home-loader-node-b" cx="52" cy="39" r="5" />
            <circle className="home-loader-node home-loader-node-c" cx="86" cy="81" r="4" />
            <circle className="home-loader-node home-loader-node-d" cx="113" cy="27" r="5" />
            <circle className="home-loader-node home-loader-node-e" cx="135" cy="77" r="4" />
          </svg>
          <span className="home-loader-orbit" />
        </div>

        <p className="eyebrow mt-6">{site.college}</p>
        <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.06em] text-ink sm:text-5xl">
          {site.name}
        </p>
        <p className="mt-2 text-sm text-mute" role="status" aria-live="polite">
          Connecting the dots…
        </p>
        <div className="home-loader-track mt-7" aria-hidden>
          <span />
        </div>
      </div>
    </section>
  );
}
