"use client";

import { useState, useTransition } from "react";
import { saveProfile, saveRiskLimits, createStrategy, deleteStrategy } from "./actions";

type Tab = "profil" | "strategie" | "rygor" | "bezpieczenstwo";

const TABS: { id: Tab; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "strategie", label: "Strategie" },
  { id: "rygor", label: "Rygor & Limity" },
  { id: "bezpieczenstwo", label: "Bezpieczeństwo" },
];

interface UserProfile {
  email: string;
  displayName: string;
  accountSize: number;
  currency: string;
  timezone: string;
  riskPerTrade: number;
  dailyLossLimit: number;
  maxPositions: number;
  weeklyTarget: number;
  drawdownAlert: number;
}

interface Strategy { id: string; name: string; description: string | null; }

export default function SettingsClient({
  profile,
  strategies,
}: {
  profile: UserProfile;
  strategies: Strategy[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [savedTab, setSavedTab] = useState<Tab | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleProfileSave = (formData: FormData) => {
    startTransition(async () => {
      await saveProfile(formData);
      setSavedTab("profil");
      setTimeout(() => setSavedTab(null), 2500);
    });
  };

  const handleRiskSave = (formData: FormData) => {
    startTransition(async () => {
      await saveRiskLimits(formData);
      setSavedTab("rygor");
      setTimeout(() => setSavedTab(null), 2500);
    });
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-on-surface">Ustawienia & Bezpieczeństwo</h2>
        <p className="text-on-surface-variant mt-1">Zarządzaj preferencjami konta i parametrami ryzyka.</p>
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

      {/* ── PROFIL ─────────────────────────────────────────────────── */}
      {activeTab === "profil" && (
        <form action={handleProfileSave}>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-8 bg-surface-container rounded-lg border border-outline-variant">
              <div className="p-5 border-b border-outline-variant flex justify-between items-center">
                <h3 className="text-lg font-semibold text-on-surface">Dane Konta</h3>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-5 py-2 rounded-lg font-mono text-xs uppercase transition-all ${
                    savedTab === "profil"
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary text-on-primary hover:bg-primary-fixed-dim"
                  } disabled:opacity-60`}
                >
                  {savedTab === "profil" ? "✓ Zapisano" : isPending ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">Nazwa / Pseudonim</label>
                  <input
                    name="displayName"
                    type="text"
                    defaultValue={profile.displayName}
                    placeholder="np. Michał K."
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-surface-container-highest border-b-2 border-outline-variant px-3 py-2.5 text-on-surface-variant font-mono text-sm outline-none rounded-t opacity-60 cursor-not-allowed"
                  />
                </div>

                {/* KAPITAŁ POCZĄTKOWY — główne pole */}
                <div className="col-span-2 bg-surface-container-high border border-primary/30 rounded-lg p-4">
                  <label className="block font-mono text-[10px] text-primary uppercase mb-2 tracking-widest">
                    Kapitał Konta (Rozmiar Rachunku)
                  </label>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input
                        name="accountSize"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={profile.accountSize}
                        className="w-full bg-surface-container-lowest border-b-2 border-primary focus:border-primary px-3 py-3 text-on-surface font-mono text-xl font-bold outline-none rounded-t transition-colors text-right"
                      />
                    </div>
                    <div className="pb-0.5">
                      <select
                        name="currency"
                        defaultValue={profile.currency}
                        className="bg-surface-container-low border border-outline-variant rounded px-3 py-3 text-on-surface font-mono text-sm outline-none focus:border-primary transition-colors"
                      >
                        <option value="USD">USD $</option>
                        <option value="EUR">EUR €</option>
                        <option value="PLN">PLN zł</option>
                        <option value="GBP">GBP £</option>
                      </select>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-2">
                    Używane do obliczania % ryzyka na transakcję w Asystencie Ryzyka i dashboardzie.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">Strefa Czasowa</label>
                  <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
                    {(["local", "utc"] as const).map((tz) => (
                      <label
                        key={tz}
                        className={`flex-1 text-center py-2 rounded font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                          profile.timezone === tz
                            ? "bg-surface-container-highest text-on-surface font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <input type="radio" name="timezone" value={tz} defaultChecked={profile.timezone === tz} className="sr-only" />
                        {tz === "local" ? "Lokalny" : "UTC"}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div className="col-span-4 bg-surface-container rounded-lg border border-outline-variant p-6 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-3xl font-bold">
                {profile.displayName ? profile.displayName[0].toUpperCase() : profile.email[0].toUpperCase()}
              </div>
              <p className="font-mono text-xs text-on-surface-variant text-center">{profile.email}</p>
              <div className="w-full pt-3 border-t border-outline-variant text-center">
                <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-1">Kapitał</p>
                <p className="text-2xl font-bold text-primary">
                  {profile.accountSize.toLocaleString("pl-PL")} {profile.currency}
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── STRATEGIE ──────────────────────────────────────────────── */}
      {activeTab === "strategie" && (
        <div className="grid grid-cols-12 gap-5">
          {/* Lista */}
          <div className="col-span-7 bg-surface-container rounded-lg border border-outline-variant">
            <div className="p-5 border-b border-outline-variant">
              <h3 className="text-lg font-semibold text-on-surface">Strategie ({strategies.length})</h3>
              <p className="text-sm text-on-surface-variant mt-1">Kliknij kosz aby usunąć. Transakcje przypisane do strategii zachowają ją jako NULL.</p>
            </div>
            {strategies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">extension</span>
                <p className="text-sm text-on-surface-variant">Brak strategii. Dodaj pierwszą →</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/50">
                {strategies.map((s) => (
                  <div key={s.id} className="flex items-start justify-between p-4 hover:bg-surface-container-high/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">extension</span>
                      <div>
                        <p className="text-sm text-on-surface font-medium">{s.name}</p>
                        {s.description && <p className="font-mono text-[10px] text-on-surface-variant mt-1 max-w-xs">{s.description}</p>}
                      </div>
                    </div>
                    <form action={deleteStrategy.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
                        title="Usuń strategię"
                        onClick={(e) => { if (!confirm(`Usunąć strategię "${s.name}"?`)) e.preventDefault(); }}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formularz dodawania */}
          <div className="col-span-5 bg-surface-container rounded-lg border border-outline-variant">
            <div className="p-5 border-b border-outline-variant">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
                Dodaj Strategię
              </h3>
            </div>
            <form action={createStrategy} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">Nazwa *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="np. VWAP Bounce, ORB Breakout..."
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">Opis (opcjonalny)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Warunki wejścia, założenia strategii..."
                  className="w-full bg-surface-container-low border border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface text-sm outline-none rounded transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-mono text-xs uppercase hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Dodaj Strategię
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RYGOR & LIMITY ─────────────────────────────────────────── */}
      {activeTab === "rygor" && (
        <form action={handleRiskSave}>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-8 bg-surface-container rounded-lg border border-outline-variant">
              <div className="p-5 border-b border-outline-variant flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">warning</span>
                    Parametry Ryzyka
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">Globalne limity dla Asystenta pre-trade.</p>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-5 py-2 rounded-lg font-mono text-xs uppercase transition-all ${
                    savedTab === "rygor"
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary text-on-primary hover:bg-primary-fixed-dim"
                  } disabled:opacity-60`}
                >
                  {savedTab === "rygor" ? "✓ Zapisano" : isPending ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                {[
                  { name: "riskPerTrade", label: "Max Ryzyko na Transakcję (%)", value: profile.riskPerTrade, step: "0.1", hint: "% kapitału konta per trade" },
                  { name: "dailyLossLimit", label: "Dzienny Limit Spadku (USD)", value: profile.dailyLossLimit, step: "10", hint: "Stop trading po przekroczeniu" },
                  { name: "maxPositions", label: "Max Otwartych Pozycji", value: profile.maxPositions, step: "1", hint: "Jednocześnie na rynku" },
                  { name: "weeklyTarget", label: "Tygodniowy Cel Zysku (USD)", value: profile.weeklyTarget, step: "10", hint: "Docelowy P&L tygodniowy" },
                  { name: "drawdownAlert", label: "Alert Drawdown (%)", value: profile.drawdownAlert, step: "0.5", hint: "Powiadomienie przy osiągnięciu progu" },
                ].map(({ name, label, value, step, hint }) => (
                  <div key={name}>
                    <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">{label}</label>
                    <input
                      name={name}
                      type="number"
                      step={step}
                      min="0"
                      defaultValue={value}
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-3 py-2.5 text-on-surface font-mono text-sm outline-none rounded-t transition-colors"
                    />
                    <p className="font-mono text-[9px] text-on-surface-variant mt-1">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Security sidebar */}
            <div className="col-span-4 bg-surface-container rounded-lg border border-outline-variant flex flex-col">
              <div className="p-5 border-b border-outline-variant">
                <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
                  Status Bezpieczeństwa
                </h3>
              </div>
              <div className="p-5 flex-1 space-y-4">
                {[
                  { icon: "check_circle", color: "text-secondary", label: "Izolacja Single-Tenant", status: "Aktywna" },
                  { icon: "check_circle", color: "text-secondary", label: "Row Level Security (RLS)", status: "Wymuszone" },
                  { icon: "lock", color: "text-secondary", label: "Publiczna Rejestracja", status: "Zablokowana" },
                ].map(({ icon, color, label, status }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${color} mt-0.5 text-[20px]`}>{icon}</span>
                    <div>
                      <p className="text-sm text-on-surface">{label}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant uppercase mt-0.5">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── BEZPIECZEŃSTWO ─────────────────────────────────────────── */}
      {activeTab === "bezpieczenstwo" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-surface-container rounded-lg border border-outline-variant p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">key</span>
              Sesja & Autentykacja
            </h3>
            <div className="space-y-3">
              {[
                { icon: "check_circle", color: "text-secondary", label: "Supabase Auth", note: "JWT Token — aktywna sesja" },
                { icon: "check_circle", color: "text-secondary", label: "Row Level Security", note: "Polityki RLS aktywne na wszystkich tabelach" },
                { icon: "lock", color: "text-secondary", label: "Rejestracja Zablokowana", note: "Brak możliwości tworzenia nowych kont" },
              ].map(({ icon, color, label, note }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className={`material-symbols-outlined ${color} mt-0.5 text-[20px]`}>{icon}</span>
                  <div>
                    <p className="text-sm text-on-surface">{label}</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-container rounded-lg border border-outline-variant p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4 pb-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">shield</span>
              Supabase
            </h3>
            <div className="space-y-3 text-sm text-on-surface-variant">
              <p>Projekt: <span className="text-on-surface font-mono">tsgqmtwiddstrnrprpmx</span></p>
              <p>Region: <span className="text-on-surface font-mono">eu-central-1</span></p>
              <p>Baza: <span className="text-on-surface font-mono">PostgreSQL 15</span></p>
              <p>Storage: <span className="text-on-surface font-mono">trade-screenshots</span></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
