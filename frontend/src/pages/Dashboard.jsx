import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  Download, FileBarChart, RefreshCw, Upload, Printer, GitCompare,
} from "lucide-react";
import FilterBar from "@/components/analytics/FilterBar";
import KpiCards from "@/components/analytics/KpiCards";
import TimeSeriesChart from "@/components/analytics/TimeSeriesChart";
import StatusDonut from "@/components/analytics/StatusDonut";
import CategoryBar from "@/components/analytics/CategoryBar";
import PicPerformance from "@/components/analytics/PicPerformance";
import ChannelChart from "@/components/analytics/ChannelChart";
import InsightsPanel from "@/components/analytics/InsightsPanel";
import RecordsTable from "@/components/analytics/RecordsTable";
import ImportDialog from "@/components/analytics/ImportDialog";
import SavedViews from "@/components/analytics/SavedViews";
import { Button } from "@/components/ui/button";
import {
  fetchFilters, fetchSummary, fetchTimeseries, fetchStatus,
  fetchCategories, fetchPic, fetchChannels, fetchInsights,
  fetchComparison, exportCsvUrl,
} from "@/lib/api";

const emptyFilters = {
  start_date: "",
  end_date: "",
  categories: [],
  pics: [],
  statuses: [],
  channels: [],
};

// URL <-> filters helpers
function filtersFromParams(params) {
  const csv = (k) => (params.get(k) ? params.get(k).split(",").filter(Boolean) : []);
  return {
    start_date: params.get("start_date") || "",
    end_date: params.get("end_date") || "",
    categories: csv("categories"),
    pics: csv("pics"),
    statuses: csv("statuses"),
    channels: csv("channels"),
  };
}
function filtersToParams(f) {
  const out = {};
  if (f.start_date) out.start_date = f.start_date;
  if (f.end_date) out.end_date = f.end_date;
  if (f.categories.length) out.categories = f.categories.join(",");
  if (f.pics.length) out.pics = f.pics.join(",");
  if (f.statuses.length) out.statuses = f.statuses.join(",");
  if (f.channels.length) out.channels = f.channels.join(",");
  return out;
}

const COMPARE_MODES = [
  { key: "", label: "Off" },
  { key: "wow", label: "WoW" },
  { key: "mom", label: "MoM" },
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState(() => filtersFromParams(searchParams));
  const [options, setOptions] = useState({ categories: [], pics: [], statuses: [], channels: [] });
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [picData, setPicData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [granularity, setGranularity] = useState(() => searchParams.get("g") || "day");
  const [compareMode, setCompareMode] = useState(() => searchParams.get("c") || "");
  const [importOpen, setImportOpen] = useState(false);

  const writeUrl = (nextFilters, nextGranularity, nextCompare) => {
    const urlParams = filtersToParams(nextFilters);
    if (nextGranularity && nextGranularity !== "day") urlParams.g = nextGranularity;
    if (nextCompare) urlParams.c = nextCompare;
    setSearchParams(urlParams, { replace: true });
  };

  const setFilters = (next) => {
    const nextObj = typeof next === "function" ? next(filters) : next;
    setFiltersState(nextObj);
    writeUrl(nextObj, granularity, compareMode);
  };

  const changeGranularity = (g) => {
    setGranularity(g);
    writeUrl(filters, g, compareMode);
  };

  const changeCompare = (c) => {
    setCompareMode(c);
    writeUrl(filters, granularity, c);
  };

  const toggleFilterValue = (key, value) => {
    setFilters((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
    toast.success(`Filtered: ${value}`);
  };

  const loadView = (view) => {
    setFiltersState(view.filters);
    if (view.granularity) setGranularity(view.granularity);
    writeUrl(view.filters, view.granularity || "day", compareMode);
  };

  const params = useMemo(() => ({
    start_date: filters.start_date || undefined,
    end_date: filters.end_date || undefined,
    categories: filters.categories.length ? filters.categories : undefined,
    pics: filters.pics.length ? filters.pics : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    channels: filters.channels.length ? filters.channels : undefined,
  }), [filters]);

  useEffect(() => {
    fetchFilters()
      .then((opts) => setOptions(opts))
      .catch(() => toast.error("Failed to load filter options"));
  }, [refreshTick]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchSummary(params),
      fetchTimeseries({ ...params, granularity }),
      fetchStatus(params),
      fetchCategories(params),
      fetchPic(params),
      fetchChannels(params),
      fetchInsights(params),
    ])
      .then(([sum, ts, st, cat, pic, ch, ins]) => {
        if (cancelled) return;
        setSummary(sum);
        setTimeseries(ts);
        setStatusData(st);
        setCategoryData(cat);
        setPicData(pic);
        setChannelData(ch);
        setInsights(ins);
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params, refreshTick, granularity]);

  // Comparison fetch (separate so KPI + charts don't refetch when comparison toggles)
  useEffect(() => {
    let cancelled = false;
    if (!compareMode) { setComparison(null); return; }
    fetchComparison({ ...params, compare: compareMode })
      .then((data) => !cancelled && setComparison(data))
      .catch(() => !cancelled && setComparison(null));
    return () => { cancelled = true; };
  }, [params, compareMode, refreshTick]);

  const handleExport = () => {
    const url = exportCsvUrl(params);
    window.open(url, "_blank");
    toast.success("Export CSV dimulai");
  };

  const handlePrint = () => {
    toast.info("Membuka dialog print / save as PDF");
    setTimeout(() => window.print(), 250);
  };

  const handleReset = () => setFilters(emptyFilters);

  const onImportDone = ({ rows, filename }) => {
    toast.success(`Berhasil import ${rows.toLocaleString()} baris dari ${filename}`);
    setImportOpen(false);
    setRefreshTick((n) => n + 1);
  };

  const onRestoreDone = ({ rows, restored_from }) => {
    toast.success(`Restored dari backup ${restored_from} (${rows.toLocaleString()} baris)`);
    setImportOpen(false);
    setRefreshTick((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 grain-bg font-body" data-testid="dashboard-root">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 print:hidden">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-zinc-100 tracking-tight leading-none">
                KYC · Analytics Console
              </h1>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
                Customer Profile Update Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SavedViews
              currentFilters={filters}
              currentGranularity={granularity}
              onLoad={loadView}
            />
            <div
              className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5"
              data-testid="compare-toggle"
            >
              <GitCompare className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1" />
              {COMPARE_MODES.map((m) => (
                <button
                  key={m.key || "off"}
                  data-testid={`compare-${m.key || "off"}`}
                  onClick={() => changeCompare(m.key)}
                  className={`px-2.5 py-1 rounded font-mono-data text-[10px] uppercase tracking-[0.15em] transition-colors ${
                    compareMode === m.key
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Button
              data-testid="btn-import"
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Upload className="w-3.5 h-3.5 mr-2" /> Import Data
            </Button>
            <Button
              data-testid="btn-refresh"
              variant="outline"
              size="sm"
              onClick={() => setRefreshTick((n) => n + 1)}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
            </Button>
            <Button
              data-testid="btn-print-pdf"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Printer className="w-3.5 h-3.5 mr-2" /> Print / PDF
            </Button>
            <Button
              data-testid="btn-export-csv"
              size="sm"
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
        {compareMode && comparison?.current_period && (
          <div
            data-testid="compare-period-banner"
            className="max-w-[1600px] mx-auto px-6 pb-3 -mt-1 flex items-center gap-3 flex-wrap"
          >
            <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {compareMode.toUpperCase()} Comparison:
            </span>
            <span className="font-mono-data text-[11px] text-zinc-300">
              {comparison.current_period.start} → {comparison.current_period.end}
            </span>
            <span className="font-mono-data text-[11px] text-zinc-600">vs</span>
            <span className="font-mono-data text-[11px] text-zinc-500">
              {comparison.previous_period.start} → {comparison.previous_period.end}
            </span>
          </div>
        )}
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 print:px-0 print:py-2">
        <FilterBar
          options={options}
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
        />

        <KpiCards summary={summary} loading={loading} comparison={comparison} />

        {/* Charts grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="charts-grid">
          <div className="lg:col-span-2">
            <TimeSeriesChart
              data={timeseries}
              granularity={granularity}
              onGranularityChange={changeGranularity}
            />
          </div>
          <div>
            <StatusDonut
              data={statusData}
              onSliceClick={(status) => toggleFilterValue("statuses", status)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CategoryBar
              data={categoryData}
              onBarClick={(category) => toggleFilterValue("categories", category)}
            />
          </div>
          <div>
            <ChannelChart
              data={channelData}
              onBarClick={(channel) => toggleFilterValue("channels", channel)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PicPerformance
              data={picData}
              onBarClick={(pic) => toggleFilterValue("pics", pic)}
            />
          </div>
          <div>
            <InsightsPanel data={insights} />
          </div>
        </section>

        {/* Records */}
        <RecordsTable filters={params} />

        <footer className="py-6 border-t border-zinc-800 mt-8 print:hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Data source: uploaded / data_dummy_3000.xlsx
            </p>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Emergent · Analytics
            </p>
          </div>
        </footer>
      </main>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={onImportDone}
        onRestore={onRestoreDone}
      />
    </div>
  );
}
