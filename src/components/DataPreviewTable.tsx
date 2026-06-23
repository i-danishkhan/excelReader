import { formatCell, type ParsedSheet } from "@/lib/excel-utils";

export function DataPreviewTable({ sheet }: { sheet: ParsedSheet }) {
  const preview = sheet.rows.slice(0, 10);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </th>
              {sheet.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                {sheet.headers.map((_, j) => (
                  <td key={j} className="px-3 py-2 whitespace-nowrap">
                    {formatCell(row[j])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sheet.rows.length > 10 && (
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Showing 10 of {sheet.rows.length.toLocaleString()} rows
        </p>
      )}
    </div>
  );
}
