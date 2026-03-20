"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/tabla", label: "Tabla" },
  { href: "/jugadores", label: "Jugadores" },
  { href: "/enfrentamientos", label: "Enfrentamientos" },
  { href: "/partidos", label: "Partidos" },
];

export default function MainNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`top-0 z-50 w-full ${
        isHome
          ? "absolute left-0 right-0"
          : "sticky border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
      }`}
    >
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg ${
                isHome
                  ? "border border-white/20 bg-white/10 backdrop-blur"
                  : "border border-slate-200 bg-white"
              }`}
            >
              <img
                src="/logo/escalerilla-logo.png"
                alt="Escalerilla Locos x el Tenis"
                className="h-full w-full object-cover"
              />
            </div>

            <div className={`min-w-0 ${isHome ? "text-white" : "text-slate-900"}`}>
              <p className="truncate text-xs font-black uppercase tracking-[0.18em] sm:text-sm">
                Escalerilla
              </p>
              <p
                className={`truncate text-[11px] font-semibold sm:text-xs ${
                  isHome ? "text-white/75" : "text-slate-500"
                }`}
              >
                Locos x el Tenis
              </p>
            </div>
          </Link>

          <nav className="hidden flex-wrap items-center gap-2 md:flex">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isHome
                      ? isActive
                        ? "bg-white text-slate-900 shadow"
                        : "bg-white/10 text-white backdrop-blur hover:bg-white/20"
                      : isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border md:hidden ${
              isHome
                ? "border-white/20 bg-white/10 text-white backdrop-blur"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <span className="text-lg font-black">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {menuOpen && (
          <div
            className={`mt-3 rounded-2xl border p-2 shadow-lg md:hidden ${
              isHome
                ? "border-white/15 bg-slate-950/75 backdrop-blur"
                : "border-slate-200 bg-white"
            }`}
          >
            <nav className="grid gap-1">
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isHome
                        ? isActive
                          ? "bg-white text-slate-900"
                          : "text-white hover:bg-white/10"
                        : isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}