"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/log", icon: "format_list_bulleted", label: "Trade Log" },
  { href: "/analytics", icon: "query_stats", label: "Analytics" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface-container-low border-r border-outline-variant fixed left-0 top-0 h-full w-64 flex flex-col z-50 p-6 gap-y-2">
      {/* Brand */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">TraderNote</h1>
        <p className="font-mono text-xs text-on-surface-variant uppercase mt-1 tracking-widest">
          Institutional Grade
        </p>
      </div>

      {/* New Trade Button */}
      <Link
        href="/new"
        className="bg-primary text-on-primary w-full py-3 px-4 rounded-lg mb-4 flex items-center justify-center gap-2 font-semibold text-sm hover:bg-primary-fixed-dim transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Trade
      </Link>

      {/* Nav Links */}
      <div className="flex-1 flex flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isActive
                  ? "bg-surface-container-highest text-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          Support
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </a>
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
            M
          </div>
          <div>
            <div className="text-xs text-on-surface font-medium">Michał K.</div>
            <div className="text-[10px] text-on-surface-variant">Pro Trader</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
