import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { Search, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const Inspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/inspections-list`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load");
        setInspections(data.inspections ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = inspections.filter((i: any) =>
    i.productName.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Inspections</h1>
        <p className="text-sm text-muted-foreground">Food quality inspections</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search inspections..." className="pl-9" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading inspections…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Item / Business</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Inspector</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Findings</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No inspections found</td></tr>
                  ) : filtered.map((i: any) => (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{i.productName}</div>
                        <div className="text-xs text-muted-foreground">{i.businessName}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{i.location}</td>
                      <td className="px-4 py-3 text-muted-foreground">{i.inspector}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{i.date}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{i.findings || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inspections;