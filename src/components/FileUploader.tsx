import { useRef, useState, type DragEvent } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
}

const ACCEPT = ".xlsx,.xls";

export function FileUploader({ onFile, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (file: File | undefined) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setError("Unsupported file type. Please upload an .xlsx or .xls file.");
      return;
    }
    setError(null);
    onFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
        }`}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold">Drop your Excel file here</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Supports .xlsx and .xls files only
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0] ?? undefined)}
        />
        <Button
          className="mt-6"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          size="lg"
        >
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Parsing..." : "Upload Excel File"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
