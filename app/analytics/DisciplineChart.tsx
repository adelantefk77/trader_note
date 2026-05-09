"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WeeklyPoint {
  period: string;
  adherence: number;
  pnl: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload?.length) {
    const adherence = payload.find((p) => p.name === "adherence");
    const pnl = payload.find((p) => p.name === "pnl");
    return (
      <div className="bg-surface-container-lowest border border-primary px-3 py-2 rounded-lg text-xs font-mono">
        <p className="text-on-surface font-bold mb-1">{label}</p>
        <p className="text-on-surface-variant">Dyscyplina: {adherence?.value}%</p>
        <p className={`font-bold ${(pnl?.value ?? 0) >= 0 ? "text-secondary" : "text-tertiary-container"}`}>
          P&L: {(pnl?.value ?? 0) >= 0 ? "+" : ""}{pnl?.value?.toFixed(2)}$
        </p>
      </div>
    );
  }
  return null;
};

export default function DisciplineChart({ data }: { data: WeeklyPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-center">
        <div>
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2 block">bar_chart</span>
          <p className="text-sm text-on-surface-variant">Za mało danych — dodaj zamknięte transakcje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#464554" strokeOpacity={0.4} />
          <XAxis dataKey="period" tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#464554" }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="adherence" name="adherence" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.3} />)}
          </Bar>
          <Bar yAxisId="right" dataKey="pnl" name="pnl" radius={[2, 2, 0, 0]} maxBarSize={20}>
            {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? "#4edea3" : "#ff516a"} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
