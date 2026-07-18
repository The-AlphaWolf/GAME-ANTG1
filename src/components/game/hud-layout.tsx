'use client';

import { ReactNode } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
// import removed

interface HudLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function HudLayout({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
}: HudLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Bar (Sticky) */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur shrink-0 flex items-center justify-between px-4 z-10">
        <div className="flex-1 flex items-center">{topBar}</div>

        {/* Mobile Nav Triggers */}
        <div className="md:hidden flex gap-2">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 h-8 w-8 bg-zinc-900 border-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Vitals</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0"
            >
              {leftPanel}
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 h-8 w-8 bg-zinc-900 border-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              <span className="text-xs">INV</span>
              <span className="sr-only">Toggle Quick Access</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0"
            >
              {rightPanel}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Vitals (Hidden on Mobile) */}
        <aside className="hidden md:flex w-[280px] lg:w-[320px] flex-col border-r border-zinc-800 bg-zinc-950/50 shrink-0">
          {leftPanel}
        </aside>

        {/* Center Panel - Narrative Console */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-900/20">
          {centerPanel}
        </main>

        {/* Right Panel - Quick Access (Hidden on Mobile) */}
        <aside className="hidden md:flex w-[280px] lg:w-[320px] flex-col border-l border-zinc-800 bg-zinc-950/50 shrink-0">
          {rightPanel}
        </aside>
      </div>
    </div>
  );
}
