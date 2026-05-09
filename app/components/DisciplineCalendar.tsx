"use client";

const DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt"];

interface TradeForCalendar {
  exit_time: string | null;
  status: string;
  tags?: { name: string }[];
}

interface Props {
  trades?: TradeForCalendar[];
}

const ERROR_TAGS = ["FOMO", "Revenge Trading", "Oversize", "Hesitation"];

function buildCalendarFromTrades(trades: TradeForCalendar[]) {
  const dayMap: Record<string, { total: number; errors: number }> = {};

  for (const t of trades) {
    if (t.status !== "CLOSED" || !t.exit_time) continue;
    const dateKey = t.exit_time.split("T")[0];
    if (!dayMap[dateKey]) dayMap[dateKey] = { total: 0, errors: 0 };
    dayMap[dateKey].total++;
    const hasError = (t.tags ?? []).some((tag) => ERROR_TAGS.includes(tag.name));
    if (hasError) dayMap[dateKey].errors++;
  }

  return Object.entries(dayMap).map(([date, { total, errors }]) => ({
    date,
    adherence: total > 0 ? Math.round(((total - errors) / total) * 100) : 100,
  }));
}

function getCellColor(adherence: number) {
  if (adherence >= 90) return "bg-secondary opacity-100";
  if (adherence >= 70) return "bg-secondary opacity-60";
  if (adherence >= 40) return "bg-error opacity-60";
  return "bg-error opacity-90";
}

export default function DisciplineCalendar({ trades = [] }: Props) {
  const calendarData = buildCalendarFromTrades(trades);

  if (calendarData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">calendar_month</span>
        <p className="font-mono text-[10px] text-on-surface-variant">Brak danych o dyscyplinie</p>
      </div>
    );
  }

  const sorted = [...calendarData].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center font-mono text-[10px] text-on-surface-variant">{d}</div>
        ))}
        <div className="col-span-2" />
      </div>

      <div className="grid grid-cols-5 gap-1">
        {sorted.map(({ date, adherence }) => (
          <div
            key={date}
            className={`w-full aspect-square rounded-sm cursor-pointer ${getCellColor(adherence)}`}
            title={`${date}: Zgodność ${adherence}%`}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-secondary rounded-sm opacity-100" />
          <span className="font-mono text-[10px] text-on-surface-variant">≥90% dyscyplina</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-error rounded-sm opacity-60" />
          <span className="font-mono text-[10px] text-on-surface-variant">Błędy</span>
        </div>
      </div>
    </div>
  );
}
