import React from "react";

interface HeaderProps {
  onScrollToSection: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToSection }) => {
  return (
    <header className="fixed top-0 left-0 w-full h-20 z-50 flex items-center justify-between px-6 md:px-12 pointer-events-none">
      {/* Mix Blend Difference Container for text legibility */}
      <div className="w-full flex items-center justify-between pointer-events-auto mix-blend-difference text-white">
        {/* Logo in Italic Serif */}
        <a href="#" className="font-display italic text-2xl md:text-3xl font-bold tracking-tight text-white select-none">
          Mail Guard <span className="font-normal font-sans text-xs uppercase tracking-[0.4em] ml-2 not-italic">[AI]</span>
        </a>

        {/* Center Monospace Navigation Links with 1px growing underline */}
        <nav className="hidden md:flex items-center gap-8 font-mono-tracked text-xs text-white/90">
          <button
            onClick={() => onScrollToSection("analyzer")}
            className="nav-link-grow hover:text-white transition-colors cursor-pointer py-1"
          >
            [ANALYZER]
          </button>
          <button
            onClick={() => onScrollToSection("categories")}
            className="nav-link-grow hover:text-white transition-colors cursor-pointer py-1"
          >
            [CATEGORIES]
          </button>
          <button
            onClick={() => onScrollToSection("capabilities")}
            className="nav-link-grow hover:text-white transition-colors cursor-pointer py-1"
          >
            [CAPABILITIES]
          </button>
          <button
            onClick={() => onScrollToSection("architecture")}
            className="nav-link-grow hover:text-white transition-colors cursor-pointer py-1"
          >
            [ARCHITECTURE]
          </button>
        </nav>

        {/* Right Pill-shaped CTA with Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/30 bg-black/20 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-mono-tracked text-[11px] text-white font-medium">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
