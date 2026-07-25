import { CheckCircle2, XCircle, Clock, Activity, Timer, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

function DeltaChip({ value, positiveGood = true, suffix = "%", testId }) {
  if (value === null || value === undefined) return null;
  const isZero = Math.abs(value) < 0.05;
  const isUp = value > 0;
  const good =
    (isUp && positiveGood) || (!isUp && !positiveGood && !isZero);
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const color = isZero
    ? "bg-zinc-800/60 text-zinc-400 border-zinc-700"
    : good
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    : "bg-rose-500/10 text-rose-300 border-rose-500/20";
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono-data ${color}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {isUp && !isZero ? "+" : ""}{value}{suffix}
    </span>
  );
}

function Kpi({ label, value, sub, accent, icon: Icon, testId, delta }) {
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
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="font-mono-data text-2xl sm:text-3xl font-light text-zinc-100 tabular-nums">
          {value}
        </div>
        {delta}
      </div>
      {sub && <div className="mt-2 text-xs text-zinc-500 font-body">{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-US");
}

export default function KpiCards({ summary, loading, comparison }) {
  const s = summary || {};
  const d = comparison?.delta || {};
  const modeLabel = comparison?.mode ? comparison.mode.toUpperCase() : null;

  return (
    <section
      data-testid="kpi-grid"
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
    >
      <Kpi
        label={`Total Records${modeLabel ? ` · ${modeLabel}` : ""}`}
        value={loading ? "…" : fmt(s.total_records)}
        sub={`${fmt(s.unique_customers)} unique customers`}
        icon={Activity}
        accent="bg-blue-500/10 text-blue-400 border border-blue-500/20"
        testId="kpi-total"
        delta={comparison && (
          <DeltaChip value={d.total_pct} positiveGood={true} testId="kpi-total-delta" />
        )}
      />
      <Kpi
        label="Completion Rate"
        value={loading ? "…" : `${s.completion_rate ?? 0}%`}
        sub={`${fmt(s.completed)} completed`}
        icon={CheckCircle2}
        accent="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        testId="kpi-completion"
        delta={comparison && (
          <DeltaChip value={d.completion_rate_pp} positiveGood={true} suffix="pp" testId="kpi-completion-delta" />
        )}
      />
      <Kpi
        label="Pending"
        value={loading ? "…" : fmt(s.pending)}
        sub="Awaiting action"
        icon={Clock}
        accent="bg-amber-500/10 text-amber-400 border border-amber-500/20"
        testId="kpi-pending"
        delta={comparison && (
          <DeltaChip value={d.pending_pct} positiveGood={false} testId="kpi-pending-delta" />
        )}
      />
      <Kpi
        label="Reject Rate"
        value={loading ? "…" : `${s.reject_rate ?? 0}%`}
        sub={`${fmt(s.rejected)} rejected`}
        icon={XCircle}
        accent="bg-rose-500/10 text-rose-400 border border-rose-500/20"
        testId="kpi-reject"
        delta={comparison && (
          <DeltaChip value={d.reject_rate_pp} positiveGood={false} suffix="pp" testId="kpi-reject-delta" />
        )}
      />
      <Kpi
        label="Avg SLA"
        value={loading ? "…" : (s.avg_sla_days != null ? `${s.avg_sla_days}d` : "—")}
        sub="Action → Maker processing"
        icon={Timer}
        accent="bg-purple-500/10 text-purple-400 border border-purple-500/20"
        testId="kpi-sla"
        delta={comparison && (
          <DeltaChip value={d.sla_days} positiveGood={false} suffix="d" testId="kpi-sla-delta" />
        )}
      />
    </section>
  );
}
