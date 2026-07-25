import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function CategoryBar({ data, onBarClick }) {
  return (
    <div
      data-testid="category-bar"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-full"
    >
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold text-zinc-100">Change Categories</h3>
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
          Volume by "Kategori Perubahan" · click a bar to drill-down
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" stroke="#71717a" tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="category"
              stroke="#71717a"
              tick={{ fontSize: 11 }}
              width={130}
            />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
              itemStyle={{ fontSize: 12 }}
              cursor={{ fill: "#27272a80" }}
            />
            <Bar
              dataKey="total"
              fill="#2563EB"
              radius={[0, 3, 3, 0]}
              onClick={(entry) => entry && onBarClick?.(entry.category)}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={idx === 0 ? "#60A5FA" : "#2563EB"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
