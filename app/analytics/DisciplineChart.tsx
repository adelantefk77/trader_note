"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { period: "Tydz 1", adherence: 40, pnl: -2.1, color: "#ff516a" },
  { period: "Tydz 2", adherence: 55, pnl: 0.8, color: "#ff516a" },
  { period: "Tydz 3", adherence: 60, pnl: 1.2, color: "#c0c1ff" },
  { period: "Tydz 4", adherence: 75, pnl: 2.8, color: "#c0c1ff" },
  { period: "Tydz 5", adherence: 78, pnl: 2.1, color: "#c0c1ff" },
  { period: "Tydz 6", adherence: 88, pnl: 3.9, color: "#4edea3" },
  { period: "Tydz 7", adherence: 85, pnl: 3.4, color: "#4edea3" },
  { period: "Tydz 8", adherence: 95, pnl: 5.2, color: "#4edea3" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const adherence = payload.find((p) => p.name === "adherence");
    const pnl = payload.find((p) => p.name === "pnl");
    return (
      <div className="bg-surface-container-lowest border border-primary px-3 py-2 rounded-lg text-xs font-mono">
        <p className="text-on-surface font-bold mb-1">{label}</p>
        <p className="text-on-surface-variant">Dyscyplina: {adherence?.value}%</p>
        <p className={`font-bold ${(pnl?.value ?? 0) >= 0 ? "text-secondary" : "text-tertiary-container"}`}>
          P&L: {(pnl?.value ?? 0) >= 0 ? "+" : ""}{pnl?.value}R
        </p>
      </div>
    );
  }
  return null;
};

export default function DisciplineChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#464554" strokeOpacity={0.4} />
          <XAxis
            dataKey="period"
            tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: "#464554" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#c7c4d7", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}R`}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="adherence" name="adherence" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.3} />
            ))}
          </Bar>
          <Bar yAxisId="right" dataKey="pnl" name="pnl" radius={[2, 2, 0, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-pnl-${index}`}
                fill={entry.pnl >= 0 ? "#4edea3" : "#ff516a"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
