"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

interface DataPoint {
  date: string;
  mood: number;
  label: string;
}

export default function MoodTrendChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <defs>
            <linearGradient id="moodArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C7E4D" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#5C7E4D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3EAE0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B6B66" }}
            tickFormatter={(d) => d.slice(5)}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: "#6B6B66" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #E3EAE0",
              borderRadius: "10px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            labelFormatter={(d) => `Date: ${d}`}
            formatter={(_value, _name, props: any) => [
              `${props.payload.label} (${props.payload.mood}/5)`,
              "Mood",
            ]}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#5C7E4D"
            strokeWidth={2.5}
            fill="url(#moodArea)"
            dot={{ fill: "#5C7E4D", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#5C7E4D", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
