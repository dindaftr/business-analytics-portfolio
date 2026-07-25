import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const PALETTE = ["#22D3EE", "#60A5FA", "#A78BFA", "#F472B6", "#34D399", "#FBBF24", "#FB7185", "#818CF8", "#2DD4BF", "#F59E0B"];

export default function ChannelChart({ data, onBarClick }) {
  return (
    <div
      data-testid="channel-chart"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold text-zinc-100">Channel Mix</h3>
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
          Origin of update requests · click to drill-down
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 8, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="channel" stroke="#71717a" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
              itemStyle={{ fontSize: 12 }}
              cursor={{ fill: "#27272a80" }}
            />
            <Bar
              dataKey="count"
              radius={[3, 3, 0, 0]}
              onClick={(entry) => entry && onBarClick?.(entry.channel)}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
