import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { Search, Loader2, Eye } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

// The API can return `parameters` as a plain string, an array, or an
// object (e.g. { brix: 12.5, ph: 4.1 }). Rendering an object directly in
// JSX prints "[object Object]", so normalize it to a readable string here.
const formatParameters = (params: unknown): string => {
  if (params == null) return "—";
  if (typeof params === "string") return params;
  if (Array.isArray(params)) {
    return params
      .map((p) =>
        typeof p === "object" && p !== null ? formatParameters(p) : String(p)
      )
      .join(", ");
  }
  if (typeof params === "object") {
    return Object.entries(params as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }
  return String(params);
};

// Parses "key: value, key: value" style strings back into rows for a
// cleaner detail view inside the modal. Falls back to plain text if the
// shape doesn't match (e.g. a free-text remark with no key/value pairs).
const parseParameterRows = (formatted: string): { key: string; value: string }[] | null => {
  if (!formatted || formatted === "—") return null;
  const parts = formatted.split(", ").filter(Boolean);
  const rows = parts.map((part) => {
    const idx = part.indexOf(": ");
    if (idx === -1) return null;
    return { key: part.slice(0, idx), value: part.slice(idx + 2) };
  });
  return rows.every(Boolean) ? (rows as { key: string; value: string }[]) : null;
};

const LabResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/lab-results`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load");
        setResults(data.labResults ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = results.filter((l: any) =>
    l.productName.toLowerCase().includes(search.toLowerCase()) ||
    l.testType.toLowerCase().includes(search.toLowerCase())
  );

  const selectedParams = selected ? formatParameters(selected.parameters) : "—";
  const selectedRows = selected ? parseParameterRows(selectedParams) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Lab Results</h1>
        <p className="text-sm text-muted-foreground">Laboratory test results</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search results..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading lab results…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Test Type</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Analyst</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium">Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground">
                        No lab results found
                      </td>
                    </tr>
                  ) : filtered.map((l: any) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{l.productName}</div>
                        <div className="text-xs text-muted-foreground">{l.manufacturer}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{l.testType || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.testMethod || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.analyst || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{l.date || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.result} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 px-2.5 text-xs"
                          onClick={() => setSelected(l)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.productName}</DialogTitle>
                <DialogDescription>{selected.manufacturer}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Test Type</p>
                  <p className="text-foreground">{selected.testType || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Method</p>
                  <p className="text-foreground">{selected.testMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Analyst</p>
                  <p className="text-foreground">{selected.analyst || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Date</p>
                  <p className="text-foreground">{selected.date || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Result</p>
                  <StatusBadge status={selected.result} />
                </div>
                {selected.standard && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Standard</p>
                    <p className="text-foreground">{selected.standard}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Parameters</p>
                {selectedRows ? (
                  <div className="space-y-1.5 rounded-md bg-muted/50 p-3">
                    {selectedRows.map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.key}</span>
                        <span className="font-medium text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-foreground">
                    {selectedParams}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabResults;