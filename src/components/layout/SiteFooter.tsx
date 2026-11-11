import Link from "next/link";
import Image from "next/image";
import { footerCols, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto overflow-hidden border-t border-[color:var(--on-void-line)] bg-void text-[color:var(--on-void)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 0% 100%, color-mix(in srgb, var(--ember) 22%, transparent), transparent 55%), radial-gradient(ellipse 40% 50% at 100% 0%, color-mix(in srgb, #7a8cab 16%, transparent), transparent 50%)",
        }}
      />
      <Container className="relative py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.3fr]">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ember">
              Newsletter
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[color:var(--on-void)] text-balance">
              Occasional notes when something ships.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--on-void-soft)]">
              Any email works here. College sign-in stays on{" "}
              <span className="font-mono text-ember">@stu.manit.ac.in</span>.
            </p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[color:var(--on-void-mute)]">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[color:var(--on-void-soft)] transition-colors hover:text-ember"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--on-void-line)] pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-col items-start gap-2">
              <Image
                src="/icons/svg/databiz-logo.svg"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                className="size-8"
              />
              <p className="font-display text-xl font-semibold tracking-tight">
                <span className="text-ember">Data</span>
                <span className="text-[color:var(--on-void)]">Biz</span>
              </p>
            </div>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[color:var(--on-void-mute)]">
              {site.line} · {site.college}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[color:var(--on-void-soft)]">
            <a href={`mailto:${site.email}`} className="hover:text-ember">
              {site.email}
            </a>
            <a
              href={site.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ember"
            >
              LinkedIn
            </a>
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ember"
            >
              Instagram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
