import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function MultiSelectDropdown({ label, options, selected, onChange, testId }) {
  const [open, setOpen] = useState(false);

  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid={`${testId}-trigger`}
          variant="outline"
          size="sm"
          className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 font-mono-data text-xs"
        >
          {label}
          {selected.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px]">
              {selected.length}
            </span>
          )}
          <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-zinc-900 border-zinc-800 min-w-[220px] max-h-[300px] overflow-y-auto p-1"
        align="start"
      >
        {options.length === 0 && (
          <div className="p-3 text-xs text-zinc-500">No options</div>
        )}
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              data-testid={`${testId}-option-${opt}`}
              onClick={() => toggle(opt)}
              className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs font-body transition-colors ${
                isSelected
                  ? "bg-blue-600/10 text-blue-200"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span>{opt}</span>
              {isSelected && <Check className="w-3 h-3 text-blue-400" />}
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
