import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import MultiSelectDropdown from "./MultiSelectDropdown";

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return ""; }
}

export default function FilterBar({ options, filters, onChange, onReset }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const activeCount =
    (filters.start_date ? 1 : 0) + (filters.end_date ? 1 : 0) +
    filters.categories.length + filters.pics.length +
    filters.statuses.length + filters.channels.length;

  const dateRange = {
    from: filters.start_date ? new Date(filters.start_date) : undefined,
    to: filters.end_date ? new Date(filters.end_date) : undefined,
  };

  return (
    <div
      data-testid="filter-bar"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Filters
        </span>

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              data-testid="filter-date-trigger"
              variant="outline"
              size="sm"
              className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 font-mono-data text-xs"
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-2" />
              {filters.start_date || filters.end_date
                ? `${formatDate(filters.start_date) || "…"} → ${formatDate(filters.end_date) || "…"}`
                : "Date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                set({
                  start_date: range?.from ? range.from.toISOString().slice(0, 10) : "",
                  end_date: range?.to ? range.to.toISOString().slice(0, 10) : "",
                });
              }}
              numberOfMonths={2}
              className="text-zinc-200"
            />
            <div className="p-2 border-t border-zinc-800 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                data-testid="filter-date-clear"
                onClick={() => set({ start_date: "", end_date: "" })}
                className="text-zinc-400 hover:text-zinc-100 text-xs"
              >
                Clear dates
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <MultiSelectDropdown
          label="Category"
          testId="filter-categories"
          options={options.categories || []}
          selected={filters.categories}
          onChange={(v) => set({ categories: v })}
        />
        <MultiSelectDropdown
          label="Status"
          testId="filter-statuses"
          options={options.statuses || []}
          selected={filters.statuses}
          onChange={(v) => set({ statuses: v })}
        />
        <MultiSelectDropdown
          label="PIC"
          testId="filter-pics"
          options={options.pics || []}
          selected={filters.pics}
          onChange={(v) => set({ pics: v })}
        />
        <MultiSelectDropdown
          label="Channel"
          testId="filter-channels"
          options={options.channels || []}
          selected={filters.channels}
          onChange={(v) => set({ channels: v })}
        />

        <div className="flex-1" />

        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-600/10 border-blue-500/30 text-blue-300 font-mono-data text-[10px]">
              {activeCount} active
            </Badge>
            <Button
              data-testid="filter-reset"
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="text-zinc-400 hover:text-zinc-100 text-xs"
            >
              <X className="w-3 h-3 mr-1" /> Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
