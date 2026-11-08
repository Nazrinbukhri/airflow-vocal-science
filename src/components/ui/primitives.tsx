import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function PageHeader({
  title,
  titleEn,
  intro,
  children,
}: {
  title: string;
  titleEn?: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {titleEn && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{titleEn}</p>
      )}
      <h1 className="font-display text-3xl font-bold text-gold-200 sm:text-4xl">{title}</h1>
      {intro && <div className="mt-2 max-w-3xl text-charcoal-200">{intro}</div>}
      {children}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-charcoal-700/80 bg-charcoal-900/80 p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-xl font-semibold text-gold-200">{children}</h2>
      {sub && <p className="text-sm text-charcoal-300">{sub}</p>}
    </div>
  );
}

type Tone = 'emerald' | 'gold' | 'neutral' | 'red';
const BADGE: Record<Tone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  gold: 'bg-gold-500/15 text-gold-200 ring-gold-500/30',
  neutral: 'bg-charcoal-700/60 text-charcoal-200 ring-charcoal-600',
  red: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${BADGE[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-charcoal-700"
    >
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-400 transition-[width]" style={{ width: `${v}%` }} />
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-gold-500 text-charcoal-950 hover:bg-gold-400 font-semibold',
  secondary: 'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold',
  ghost: 'border border-charcoal-600 text-charcoal-100 hover:bg-charcoal-800',
  danger: 'border border-red-500/50 text-red-300 hover:bg-red-500/10',
};

export function Button({
  variant = 'ghost',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${BTN[variant]} ${className}`}
    />
  );
}

export const buttonClass = (variant: BtnVariant = 'ghost', extra = '') =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm transition-colors ${BTN[variant]} ${extra}`;
