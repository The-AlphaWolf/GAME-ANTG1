'use client';

import { ReactNode } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Package } from 'lucide-react';

interface HudLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  /** Left slug in the top rule, e.g. "ANTG1 / CH.02". */
  slug: string;
  /** Right slug in the top rule, e.g. "2026.07". */
  stamp: string;
}

export function HudLayout({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
  slug,
  stamp,
}: HudLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Editorial top rule */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-2">
        <span className="micro">{slug}</span>
        <span className="micro">{stamp}</span>
      </div>

      {/* Status line */}
      <header className="shrink-0 border-t border-b rule px-4 md:px-6 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">{topBar}</div>

        {/* Mobile panel triggers */}
        <div className="md:hidden flex gap-1.5 shrink-0">
          <Sheet>
            <SheetTrigger
              aria-label="Open vitals"
              className="h-7 w-7 inline-flex items-center justify-center panel"
            >
              <Menu className="h-3.5 w-3.5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[290px] p-0 border-r rule"
              style={{ background: 'var(--ink-800)' }}
            >
              {leftPanel}
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger
              aria-label="Open gear"
              className="h-7 w-7 inline-flex items-center justify-center panel"
            >
              <Package className="h-3.5 w-3.5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[290px] p-0 border-l rule"
              style={{ background: 'var(--ink-800)' }}
            >
              {rightPanel}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Three-column body */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex w-[220px] lg:w-[250px] flex-col border-r rule shrink-0 overflow-hidden">
          {leftPanel}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0 p-3 md:p-4">
          {centerPanel}
        </main>

        <aside className="hidden md:flex w-[230px] lg:w-[268px] flex-col border-l rule shrink-0 overflow-hidden">
          {rightPanel}
        </aside>
      </div>

      {/* Wordmark band */}
      <footer className="shrink-0 border-t rule px-4 md:px-6 py-2.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="wordmark">ANTG1</div>
          <div className="micro mt-1">Full-stack browser survival RPG</div>
        </div>
        <div className="micro-strong hidden sm:block shrink-0 pb-1">ANTG1</div>
      </footer>
    </div>
  );
}
