'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { MOBILE_PRIMARY, NAV, isActive } from '@/lib/nav';
import { useOnline } from '@/lib/hooks/useOnline';

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/logo.svg" alt="" className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
      <span className="leading-tight">
        <span className="block whitespace-nowrap font-display text-base font-bold tracking-wide text-gold-300">CHESS MASTER AI</span>
        {!compact && (
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Aggressive Chess Academy
          </span>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [moreOpen, setMoreOpen] = useState(false);
  const online = useOnline();

  // Close the "more" sheet on Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const primary = NAV.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const moreActive = !primary.some((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-charcoal-800 bg-charcoal-900/95 lg:flex">
        <div className="border-b border-charcoal-800 px-5 py-5">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-emerald-500/15 text-gold-300 ring-1 ring-emerald-500/40'
                        : 'text-charcoal-200 hover:bg-charcoal-800 hover:text-white'
                    }`}
                  >
                    <Icon name={item.icon} className={`h-5 w-5 ${active ? 'text-gold-400' : 'text-emerald-400'}`} />
                    <span className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[11px] text-charcoal-400">{item.labelEn}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-charcoal-800 px-5 py-3 text-xs text-charcoal-400">
          {online ? 'Dalam talian' : 'Luar talian – pelajaran teras masih boleh dibuka'}
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="pt-safe sticky top-0 z-30 border-b border-charcoal-800 bg-charcoal-950/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand compact />
          {!online && (
            <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-1 text-xs text-gold-300">
              <Icon name="offline" className="h-4 w-4" /> Luar talian
            </span>
          )}
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Navigasi bawah"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-800 bg-charcoal-950/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                    active ? 'text-gold-300' : 'text-charcoal-300'
                  }`}
                >
                  <Icon name={item.icon} className="h-6 w-6" />
                  {item.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] ${
                moreActive ? 'text-gold-300' : 'text-charcoal-300'
              }`}
            >
              <Icon name="more" className="h-6 w-6" />
              Lagi
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Semua modul">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Tutup"
            onClick={() => setMoreOpen(false)}
          />
          <div className="pb-safe absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-gold-500/30 bg-charcoal-900 px-4 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg text-gold-300">Semua modul</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal-200 hover:bg-charcoal-800"
                aria-label="Tutup"
              >
                <Icon name="close" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 pb-4">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-16 items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        active ? 'border-gold-500/60 bg-emerald-500/10 text-gold-200' : 'border-charcoal-700 text-charcoal-100'
                      }`}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0 text-emerald-400" />
                      <span className="leading-tight">
                        {item.label}
                        <span className="block text-[11px] text-charcoal-400">{item.labelEn}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
