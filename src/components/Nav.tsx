"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";

const LINKS = [
  { href: "/evidence", label: "Evidence" },
  { href: "/assessment", label: "Assessment" },
  { href: "/planning", label: "Planning" },
  { href: "/safety", label: "Safety" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="no-print sticky top-0 z-30 bg-plum-dark text-white shadow-[0_6px_18px_-12px_rgba(42,16,53,0.9)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <Logo size={38} className="transition group-hover:rotate-[-8deg]" />
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-tight">Audiology Compass</span>
            <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-amber sm:block">
              Evidence-guided audiology
            </span>
          </span>
        </Link>
        <button
          className="rounded-full border border-white/40 px-3 py-1 text-sm font-semibold md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-2 text-sm font-semibold transition ${
                  active ? "text-white" : "text-stone-300 hover:text-white"
                }`}
              >
                {l.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-amber transition ${active ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>
      </div>
      {open && (
        <nav className="flex flex-col border-t border-white/15 px-4 py-2 md:hidden" aria-label="Main">
          {LINKS.map((l) => {
            const active = path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-l-4 px-3 py-2 text-sm font-semibold ${
                  active ? "border-amber text-white" : "border-transparent text-stone-300"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
