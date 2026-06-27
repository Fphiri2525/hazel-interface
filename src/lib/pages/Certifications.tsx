import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { Search, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const Certifications = () => {
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/certifications-list`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load");
        setCerts(data.certifications ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = certs.filter((c: any) =>
    c.productName.toLowerCase().includes(search.toLowerCase()) ||
    c.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Certifications</h1>
        <p className="text-sm text-muted-foreground">Product certification records</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search certifications..." className="pl-9" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading certifications…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Cert #</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Manufacturer</th>
                    <th className="px-4 py-3 font-medium">Issue Date</th>
                    <th className="px-4 py-3 font-medium">Expiry Date</th>
                    <th className="px-4 py-3 font-medium">Days Left</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No certifications found</td></tr>
                  ) : filtered.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.certNumber}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{c.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.manufacturer}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.issueDate}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.expiryDate}</td>
                      <td className="px-4 py-3">
                        {c.daysRemaining !== null ? (
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                            c.daysRemaining <= 7  ? 'bg-red-100 text-red-700'    :
                            c.daysRemaining <= 30 ? 'bg-amber-100 text-amber-700':
                                                    'bg-green-100 text-green-700'
                          }`}>
                            {c.daysRemaining}d
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
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

export default Certifications;