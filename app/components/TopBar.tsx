"use client";

import { useState } from "react";

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [search, setSearch] = useState("");

  return (
    <header className="glass-panel bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40 h-16 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 w-72 focus-within:ring-1 focus-within:ring-primary transition-all">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={title ? `Szukaj w ${title}...` : "Szukaj instrumentu, strategii..."}
          className="bg-transparent border-none outline-none text-on-surface text-sm placeholder:text-on-surface-variant font-mono w-full"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="text-primary font-mono text-xs font-bold uppercase hover:text-primary-fixed-dim transition-colors flex items-center gap-1.5 border border-primary px-3 py-1.5 rounded-lg hover:bg-primary/10">
          <span className="material-symbols-outlined text-[14px]">sync</span>
          Sync Data
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </button>
      </div>
    </header>
  );
}
