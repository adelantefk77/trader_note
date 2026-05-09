"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type Tab = "profil" | "strategie" | "rygor" | "bezpieczenstwo";

const TABS: { id: Tab; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "strategie", label: "Strategie" },
  { id: "rygor", label: "Rygor & Limity" },
  { id: "bezpieczenstwo", label: "Bezpieczeństwo" },
];

const SECURITY_STATUS = [
  { icon: "check_circle", color: "text-secondary", label: "Izolacja Single-Tenant", status: "Aktywna" },
  { icon: "check_circle", color: "text-secondary", label: "Row Level Security (RLS)", status: "Wymuszone" },
  { icon: "lock", color: "text-secondary", label: "Publiczna Rejestracja", status: "Zablokowana" },
  { icon: "shield", color: "text-primary", label: "Allowlist Email", status: "Skonfigurowana" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("rygor");
  const [timezone, setTimezone] = useState<"local" | "utc">("local");
  const [riskPerTrade, setRiskPerTrade] = useState("1.50");
  const [dailyLoss, setDailyLoss] = useState("500.00");
  const [maxPositions, setMaxPositions] = useState("3");
  const [weeklyTarget, setWeeklyTarget] = useState("1200.00");
  const [drawdownAlert, setDrawdownAlert] = useState("5.00");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Settings">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-on-surface">Ustawienia & Bezpieczeństwo</h2>
        <p className="text-on-surface-variant mt-1">Zarządzaj preferencjami konta, strategiami i parametrami ryzyka.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant flex gap-6 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-mono text-xs uppercase transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Profile Tab */}
        {activeTab === "profil" && (
          <>
            <div className="col-span-8 bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant">
                Dane Konta
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Imię i Nazwisko</label>
                  <input
                    type="text"
                    defaultValue="Michał K."
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Email</label>
                  <input
                    type="email"
                    defaultValue="trader@example.com"
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Waluta Konta</label>
                  <select className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors">
                    <option>USD — Dolar Amerykański</option>
                    <option>EUR — Euro</option>
                    <option>PLN — Złoty Polski</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Rozmiar Konta (USD)</label>
                  <input
                    type="number"
                    defaultValue="10000"
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
              </div>
              <button className="mt-6 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-mono text-xs uppercase hover:bg-primary-fixed-dim transition-colors">
                Zapisz Profil
              </button>
            </div>
            <div className="col-span-4 bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-4">Avatar</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-3xl font-bold">
                  M
                </div>
                <button className="font-mono text-xs text-primary hover:text-primary-fixed-dim transition-colors">
                  Zmień zdjęcie
                </button>
              </div>
            </div>
          </>
        )}

        {/* Strategies Tab */}
        {activeTab === "strategie" && (
          <div className="col-span-12 bg-surface-container rounded-lg border border-outline-variant p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant">
              <h3 className="text-lg font-semibold text-on-surface">Zarządzanie Strategiami</h3>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-mono text-xs uppercase hover:bg-primary-fixed-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Dodaj Strategię
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {["VWAP Bounce", "ORB Breakout", "London Breakout", "VWAP Fade"].map((s) => (
                <div key={s} className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">extension</span>
                    <span className="text-sm text-on-surface font-medium">{s}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className="text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk & Limits Tab */}
        {activeTab === "rygor" && (
          <>
            <div className="col-span-8 bg-surface-container rounded-lg border border-outline-variant">
              <div className="p-5 border-b border-outline-variant flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">warning</span>
                    Parametry Ryzyka
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Globalne limity używane przez asystenta pre-trade.
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  className={`px-5 py-2 rounded-lg font-mono text-xs uppercase transition-all ${
                    saved
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary text-on-primary hover:bg-primary-fixed-dim"
                  }`}
                >
                  {saved ? "✓ Zapisano" : "Zapisz"}
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                    Max Ryzyko na Transakcję (%)
                  </label>
                  <input
                    type="text"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                    Dzienny Limit Spadku (USD)
                  </label>
                  <input
                    type="text"
                    value={dailyLoss}
                    onChange={(e) => setDailyLoss(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                    Max Otwartych Pozycji
                  </label>
                  <input
                    type="text"
                    value={maxPositions}
                    onChange={(e) => setMaxPositions(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">
                    Tygodniowy Cel (USD)
                  </label>
                  <input
                    type="text"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-tertiary-container uppercase mb-2">
                    Alert Drawdown (%)
                  </label>
                  <input
                    type="text"
                    value={drawdownAlert}
                    onChange={(e) => setDrawdownAlert(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary-container px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-2">Strefa Czasowa</p>
                  <div className="flex bg-surface-container-low rounded p-1 border border-outline-variant w-fit">
                    {(["local", "utc"] as const).map((tz) => (
                      <button
                        key={tz}
                        onClick={() => setTimezone(tz)}
                        className={`px-4 py-1.5 rounded font-mono text-[10px] uppercase transition-colors ${
                          timezone === tz
                            ? "bg-surface-container-highest text-on-surface font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {tz === "local" ? "Lokalny" : "UTC"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="col-span-4 bg-surface-container rounded-lg border border-outline-variant flex flex-col">
              <div className="p-5 border-b border-outline-variant">
                <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
                  Status Bezpieczeństwa
                </h3>
              </div>
              <div className="p-5 flex-1 space-y-4">
                {SECURITY_STATUS.map(({ icon, color, label, status }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${color} mt-0.5 text-[20px]`}>{icon}</span>
                    <div>
                      <p className="text-sm text-on-surface">{label}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant uppercase mt-0.5">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-outline-variant">
                <button className="w-full border border-outline-variant text-on-surface font-mono text-[10px] uppercase py-2.5 rounded hover:border-primary hover:text-primary transition-colors">
                  Zarządzaj Allowlist
                </button>
              </div>
            </div>
          </>
        )}

        {/* Security Tab */}
        {activeTab === "bezpieczenstwo" && (
          <div className="col-span-12 grid grid-cols-2 gap-5">
            <div className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">shield</span>
                Allowlist Email
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Tylko adresy email z tej listy mogą zalogować się do aplikacji.
              </p>
              <div className="flex flex-col gap-3 mb-4">
                {["trader@example.com"].map((email) => (
                  <div key={email} className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                    <span className="font-mono text-xs text-on-surface">{email}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">Właściciel</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Dodaj adres email..."
                  className="flex-1 bg-surface-container-low border border-outline-variant focus:border-primary px-3 py-2 text-on-surface font-mono text-xs outline-none rounded transition-colors"
                />
                <button className="bg-primary text-on-primary px-4 py-2 rounded font-mono text-xs uppercase hover:bg-primary-fixed-dim transition-colors">
                  Dodaj
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span>
                Sesja & Autentykacja
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
                  <div>
                    <p className="text-sm text-on-surface">Supabase Auth</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">JWT Token — aktywna sesja</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
                  <div>
                    <p className="text-sm text-on-surface">Row Level Security</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Polityki RLS aktywne dla wszystkich tabel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className="material-symbols-outlined text-secondary mt-0.5">lock</span>
                  <div>
                    <p className="text-sm text-on-surface">Rejestracja Zablokowana</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Brak możliwości tworzenia nowych kont publicznych</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-5 border border-error/30 text-error font-mono text-xs uppercase py-2.5 rounded hover:bg-error/10 transition-colors">
                Wyloguj ze Wszystkich Urządzeń
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
