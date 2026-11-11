"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { navMore, navPrimary } from "@/content/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-line bg-[color-mix(in_srgb,var(--paper-elevated)_78%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--measure)] items-center justify-between gap-6 px-[var(--gutter)]">
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/icons/svg/databiz-logo.svg"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            className="size-9 shrink-0"
            priority
          />
          <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            <span className="text-ember">Data</span>
            <span className="text-ink">Biz</span>
          </span>
          <span className="hidden self-center text-ember sm:inline" aria-hidden>
            ·
          </span>
          <span className="hidden self-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-mute md:inline">
            MANIT
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Primary">
          {navPrimary.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-mute hover:text-ink",
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute -bottom-1 left-0 h-px w-full bg-ember" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/account" variant="ghost" size="sm">
            Account
          </Button>
          <Button
            href="/join"
            variant="ember"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Join
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line bg-paper-elevated lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="max-h-[min(70vh,32rem)] overflow-y-auto border-t border-line bg-paper px-[var(--gutter)] py-5 lg:hidden"
        >
          <div className="mb-5 flex flex-wrap gap-2">
            <Button href="/account" variant="ember" size="sm">
              Account
            </Button>
            <Button href="/join" variant="ghost" size="sm">
              Join
            </Button>
          </div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-mute">
            Main
          </p>
          <nav className="mt-2 flex flex-col" aria-label="Mobile primary">
            {navPrimary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b border-line py-3.5 text-base font-medium",
                  isActive(item.href) ? "text-ember" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-mute">
            More
          </p>
          <nav className="mt-2 flex flex-col" aria-label="Mobile more">
            {navMore.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b border-line py-3.5 text-base font-medium last:border-0",
                  isActive(item.href) ? "text-ember" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
