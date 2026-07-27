'use client';

import { ReactNode } from 'react';
import { SheetContent } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

/** Themed drawer body shared by every station sheet. */
export function SheetShell({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SheetContent
      side="right"
      className="w-full sm:max-w-md p-0 border-l rule"
      style={{ background: 'var(--ink-800)', color: 'var(--text)' }}
    >
      <div className="flex flex-col h-full">
        <header className="shrink-0 px-4 py-3.5 border-b rule">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em]">
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-[10px] mt-1.5 leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {subtitle}
            </p>
          )}
          {meta && <div className="mt-2">{meta}</div>}
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
          {children}
        </div>
      </div>
    </SheetContent>
  );
}

export function SheetSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="micro mb-2.5">{label}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div
      className="p-2.5 border rule flex items-center justify-between gap-3"
      style={{ borderRadius: 'var(--radius)' }}
    >
      {children}
    </div>
  );
}

type Tone = 'default' | 'accent' | 'danger' | 'talent' | 'good';

const TONES: Record<Tone, { color: string; background: string }> = {
  default: { color: 'var(--text-muted)', background: 'transparent' },
  accent: { color: 'var(--accent)', background: 'var(--accent-soft)' },
  danger: { color: 'var(--stat-health)', background: 'rgba(239,74,74,0.08)' },
  talent: { color: 'var(--talent)', background: 'var(--talent-soft)' },
  good: { color: '#4ade80', background: 'rgba(74,222,128,0.08)' },
};

export function TinyButton({
  children,
  onClick,
  disabled,
  pending,
  tone = 'default',
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  tone?: Tone;
  title?: string;
}) {
  const style = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-7 px-2.5 inline-flex items-center gap-1.5 border rule text-[10px] uppercase tracking-[0.1em] whitespace-nowrap transition-opacity disabled:opacity-40"
      style={{ ...style, borderRadius: 'var(--radius)' }}
    >
      {pending && <Loader2 className="h-3 w-3 animate-spin" />}
      {children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] italic" style={{ color: 'var(--text-dim)' }}>
      {children}
    </p>
  );
}
