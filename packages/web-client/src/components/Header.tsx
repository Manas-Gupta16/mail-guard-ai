import React from "react";

interface HeaderProps {
  onScrollToSection: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToSection }) => {
  return (
    <header className="fixed top-0 left-0 w-full h-20 z-50 bg-[#fcfbf9]/95 backdrop-blur-xl border-b border-[#e5e5e5] shadow-xs">
      <div className="max-w-7xl mx-auto h-full flex flex-row flex-nowrap items-center justify-between px-6 md:px-12 gap-4">
        {/* Logo in Italic Serif (Single Line, Never Wraps) */}
        <a
          href="#"
          className="font-display italic text-2xl md:text-3xl font-bold tracking-tight text-[#171717] select-none hover:text-indigo-700 transition-colors shrink-0 whitespace-nowrap leading-none flex flex-row items-center gap-1.5"
        >
          <span>Mail Guard</span>
          <span className="italic font-display font-bold text-indigo-700">AI</span>
        </a>

        {/* Center Monospace Navigation Links (Single Line, Cleanly Centered) */}
        <nav className="hidden lg:flex flex-row flex-nowrap items-center gap-6 xl:gap-8 shrink-0 whitespace-nowrap">
          <button
            onClick={() => onScrollToSection("analyzer")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [ANALYZER]
          </button>
          <button
            onClick={() => onScrollToSection("categories")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [CATEGORIES]
          </button>
          <button
            onClick={() => onScrollToSection("batch")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [BATCH]
          </button>
          <button
            onClick={() => onScrollToSection("observability")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [TELEMETRY]
          </button>
          <button
            onClick={() => onScrollToSection("capabilities")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [CAPABILITIES]
          </button>
          <button
            onClick={() => onScrollToSection("architecture")}
            className="nav-link-grow font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer py-1 whitespace-nowrap leading-none inline-block"
          >
            [API DOCS]
          </button>
        </nav>

        {/* Right Pill-shaped CTA with Pulsing Green Indicator */}
        <div className="flex flex-row flex-nowrap items-center shrink-0 whitespace-nowrap">
          <div className="flex flex-row flex-nowrap items-center gap-2.5 px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-2xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#171717] whitespace-nowrap leading-none">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
