import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

interface DistributionListItem {
  id: number;
  productName: string;
  category: string | null;
  batchNumber: string;
  expiryDate: string | null;
  sellerCompany: string;
  buyerCompanyName: string;
  buyerRegistrationNumber: string | null;
  buyerContactPerson: string | null;
  buyerPhone: string | null;
  destinationAddress: string;
  quantity: number;
  unitPrice: number | null;
  transactionDate: string;
  deliveryDate: string | null;
  invoiceReference: string | null;
  notes: string | null;
  recordedBy: { name: string | null; email: string | null };
  companyName: string | null;
  createdAt: string;
}

const Certifications = () => {
  const [distributions, setDistributions] = useState<DistributionListItem[]>([]);
  const [loading, setLoading]              = useState(true);
  const [error, setError]                  = useState("");
  const [search, setSearch]                = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/record-distribution`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data?.error ?? "Failed to load");
        setDistributions(data.distributions ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = distributions.filter((d) => {
    const term = search.toLowerCase();
    return (
      d.productName.toLowerCase().includes(term) ||
      d.batchNumber.toLowerCase().includes(term) ||
      d.sellerCompany.toLowerCase().includes(term) ||
      d.buyerCompanyName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Distributions</h1>
        <p className="text-sm text-muted-foreground">Product sale and distribution records</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by product, batch, seller, buyer..." className="pl-9" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading distributions…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Batch #</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Seller</th>
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Destination</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Transaction Date</th>
                    <th className="px-4 py-3 font-medium">Expiry Date</th>
                    <th className="px-4 py-3 font-medium">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">No distribution records found</td></tr>
                  ) : filtered.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.batchNumber}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{d.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.sellerCompany}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.buyerCompanyName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.destinationAddress}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {d.transactionDate ? new Date(d.transactionDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.recordedBy?.name || d.recordedBy?.email || "—"}
                      </td>
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