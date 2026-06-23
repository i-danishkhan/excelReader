import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, X, Moon, Sun, AlertCircle } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { ColumnCard } from "@/components/ColumnCard";
import { DataPreviewTable } from "@/components/DataPreviewTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseExcelFile, type ParsedWorkbook } from "@/lib/excel-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Excel Column Explorer" },
      {
        name: "description",
        content:
          "Upload an Excel file and instantly explore every column as a searchable dropdown — fully in your browser.",
      },
      { property: "og:title", content: "Excel Column Explorer" },
      {
        property: "og:description",
        content: "Drop in an .xlsx file and explore columns, stats, and filters instantly.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [sheetIdx, setSheetIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const sheet = workbook?.sheets[sheetIdx];

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const wb = await parseExcelFile(file);
      if (wb.sheets.length === 0) throw new Error("File contains no worksheets.");
      const first = wb.sheets[0];
      if (first.headers.length === 0) throw new Error("File is empty — no header row found.");
      setWorkbook(wb);
      setSheetIdx(0);
      setFileName(file.name);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to parse Excel file. It may be corrupted.",
      );
      setWorkbook(null);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setWorkbook(null);
    setFileName("");
    setError(null);
    setSheetIdx(0);
  };

  const columnValues = useMemo(() => {
    if (!sheet) return [];
    return sheet.headers.map((_, i) => sheet.rows.map((r) => r[i] ?? null));
  }, [sheet]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Excel Column Explorer</h1>
              <p className="text-xs text-muted-foreground">
                Upload, search, and analyze — 100% client-side
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((v) => !v)}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!workbook ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Explore your spreadsheet, column by column
              </h2>
              <p className="mt-3 text-muted-foreground">
                Drop in an Excel file to see every column as a searchable, sortable dropdown
                with instant statistics.
              </p>
            </div>
            <FileUploader onFile={handleFile} loading={loading} />
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          sheet && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sheet.headers.length} columns · {sheet.rows.length.toLocaleString()} rows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workbook.sheets.length > 1 && (
                    <Select
                      value={String(sheetIdx)}
                      onValueChange={(v) => setSheetIdx(Number(v))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workbook.sheets.map((s, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" onClick={clear}>
                    <X className="mr-2 h-4 w-4" /> Clear file
                  </Button>
                </div>
              </div>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Preview
                </h3>
                <DataPreviewTable sheet={sheet} />
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Columns
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sheet.headers.map((h, i) => (
                    <ColumnCard key={i} header={h} values={columnValues[i]} />
                  ))}
                </div>
              </section>
            </div>
          )
        )}
      </main>
    </div>
  );
}
