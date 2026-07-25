import { TrendingUp, CheckCircle2, XCircle, Users, Clock, Activity } from "lucide-react";

function Kpi({ label, value, sub, accent, icon: Icon, testId }) {
  return (
    <div
      data-testid={testId}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-mono-data text-3xl sm:text-4xl font-light text-zinc-100 tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs text-zinc-500 font-body">{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-US");
}

export default function KpiCards({ summary, loading }) {
  const s = summary || {};
  return (
    <section
      data-testid="kpi-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <Kpi
        label="Total Records"
        value={loading ? "…" : fmt(s.total_records)}
        sub={`${fmt(s.unique_customers)} unique customers`}
        icon={Activity}
        accent="bg-blue-500/10 text-blue-400 border border-blue-500/20"
        testId="kpi-total"
      />
      <Kpi
        label="Completion Rate"
        value={loading ? "…" : `${s.completion_rate ?? 0}%`}
        sub={`${fmt(s.completed)} completed`}
        icon={CheckCircle2}
        accent="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        testId="kpi-completion"
      />
      <Kpi
        label="Pending"
        value={loading ? "…" : fmt(s.pending)}
        sub="Awaiting action"
        icon={Clock}
        accent="bg-amber-500/10 text-amber-400 border border-amber-500/20"
        testId="kpi-pending"
      />
      <Kpi
        label="Reject Rate"
        value={loading ? "…" : `${s.reject_rate ?? 0}%`}
        sub={`${fmt(s.rejected)} rejected`}
        icon={XCircle}
        accent="bg-rose-500/10 text-rose-400 border border-rose-500/20"
        testId="kpi-reject"
      />
    </section>
  );
}
