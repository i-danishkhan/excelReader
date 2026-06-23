import { useMemo, useState } from "react";
import { ChevronDown, Search, ArrowUpDown, Download, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  computeStats,
  downloadBlob,
  exportColumnCSV,
  exportColumnXLSX,
  formatCell,
  type CellValue,
} from "@/lib/excel-utils";

interface Props {
  header: string;
  values: CellValue[];
}

type Sort = "none" | "asc" | "desc";

export function ColumnCard({ header, values }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("none");

  const stats = useMemo(() => computeStats(values), [values]);

  const indexed = useMemo(
    () => values.map((v, i) => ({ v, i: i + 1 })),
    [values],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = indexed;
    if (q) arr = arr.filter(({ v }) => formatCell(v).toLowerCase().includes(q));
    if (sort !== "none") {
      arr = [...arr].sort((a, b) => {
        const av = a.v;
        const bv = b.v;
        if (typeof av === "number" && typeof bv === "number") {
          return sort === "asc" ? av - bv : bv - av;
        }
        const as = formatCell(av);
        const bs = formatCell(bv);
        return sort === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
      });
    }
    return arr;
  }, [indexed, query, sort]);

  const handleExport = (kind: "csv" | "xlsx") => {
    const vals = filtered.map((x) => x.v);
    const safe = header.replace(/[^\w-]+/g, "_");
    if (kind === "csv") {
      downloadBlob(exportColumnCSV(header, vals), `${safe}.csv`);
    } else {
      downloadBlob(exportColumnXLSX(header, vals), `${safe}.xlsx`);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{header}</h3>
            <Badge variant="secondary" className="text-xs capitalize">
              {stats.type}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.total.toLocaleString()} rows · {stats.unique.toLocaleString()} unique ·{" "}
            {stats.empty.toLocaleString()} empty
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-5 pb-5 pt-4">
            {stats.type === "number" && stats.min !== undefined && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                <StatPill label="Min" value={stats.min.toLocaleString()} />
                <StatPill label="Max" value={stats.max!.toLocaleString()} />
                <StatPill
                  label="Avg"
                  value={stats.avg!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                />
              </div>
            )}

            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search values..."
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSort((s) => (s === "none" ? "asc" : s === "asc" ? "desc" : "none"))
                }
                title={`Sort: ${sort}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Export">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <Download className="mr-2 h-4 w-4" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="mb-2 text-xs text-muted-foreground">
              Showing {filtered.length.toLocaleString()} of {values.length.toLocaleString()}
            </p>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No matches</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.slice(0, 1000).map(({ v, i }) => (
                    <li
                      key={i}
                      className="flex items-baseline gap-3 px-3 py-1.5 text-sm hover:bg-accent/40"
                    >
                      <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {i}
                      </span>
                      <span className="min-w-0 break-words">
                        {v === null || v === "" ? (
                          <span className="italic text-muted-foreground">empty</span>
                        ) : (
                          formatCell(v)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {filtered.length > 1000 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Rendering first 1,000 results. Refine your search to narrow down.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
