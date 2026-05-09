"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EQUITY_DATA } from "../lib/mock-data";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-lowest border border-primary px-3 py-2 rounded-lg text-xs font-mono">
        <p className="text-on-surface-variant mb-1">{label}</p>
        <p className="text-primary font-bold">
          ${payload[0].value.toLocaleString("pl-PL")}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={EQUITY_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c0c1ff" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#c0c1ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#464554" strokeOpacity={0.4} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#c7c4d7", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "#464554" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#c7c4d7", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#c0c1ff"
          strokeWidth={1.5}
          fill="url(#equityGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#c0c1ff", stroke: "#0b1326", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
