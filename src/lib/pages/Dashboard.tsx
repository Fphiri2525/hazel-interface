import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../auth";
import {
  Package, ClipboardCheck, Building2, AlertTriangle, Clock, XCircle, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ── API config ────────────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:5000";
const DASHBOARD_URL = `${API_BASE_URL}/api/dashboard`;

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS = {
  COMPLIANT:               { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  NON_COMPLIANT:           { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  INVESTIGATION_REQUIRED:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  const label = status?.replace(/_/g, " ") ?? "UNKNOWN";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

// Days-remaining tag for expiry alerts (handles negative = already expired)
function DaysTag({ days }) {
  if (days === null || days === undefined) return null;
  if (days < 0) {
    return (
      <span className="ml-2 rounded px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100">
        Expired {Math.abs(days)}d ago
      </span>
    );
  }
  const color = days <= 7 ? "text-red-600 bg-red-50" : days <= 30 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-50";
  return (
    <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {days}d left
    </span>
  );
}

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];
const BAR_COLORS = { compliant: "#10b981", nonCompliant: "#ef4444", investigation: "#f59e0b" };

// ── Main component ────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(DASHBOARD_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Unknown error");
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  // ── Loading / error states ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="font-medium text-destructive">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-destructive px-4 py-1.5 text-sm text-white hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, monthlyInspections, inspectionBreakdown,
          recentInspections, expiryAlerts } = data;

  // ── Stat cards ──────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Products",      value: stats.totalProducts,     icon: Package,       color: "text-blue-500"    },
    { label: "Total Companies",     value: stats.totalCompanies,    icon: Building2,     color: "text-indigo-500"  },
    { label: "Total Inspections",   value: stats.totalInspections,  icon: ClipboardCheck,color: "text-amber-500"   },
    { label: "Failed Inspections",  value: stats.failedInspections, icon: AlertTriangle, color: "text-red-500"     },
    { label: "Expiring (30 days)",  value: stats.expiringSoon,      icon: Clock,         color: "text-amber-500"   },
    { label: "Already Expired",     value: stats.expiredCount,      icon: XCircle,       color: "text-red-500"     },
  ];

  // ── Chart data ──────────────────────────────────────────────────────
  const inspPieData = [
    { name: "Compliant",     value: inspectionBreakdown.compliant     },
    { name: "Non-Compliant", value: inspectionBreakdown.nonCompliant  },
    { name: "Investigation", value: inspectionBreakdown.investigation },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-muted p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Expiry Alerts ──────────────────────────────────────────── */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Products Nearing / Past Expiry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Batch #</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Buyer Contact</th>
                  <th className="px-4 py-3 font-medium">Buyer Phone</th>
                </tr>
              </thead>
              <tbody>
                {expiryAlerts.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No products expiring soon</td></tr>
                ) : expiryAlerts.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.productName}</div>
                      <div className="text-xs text-muted-foreground">{a.category ?? "Uncategorized"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{a.batchNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : "—"}
                      <DaysTag days={a.daysRemaining} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.quantity}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.buyerCompanyName}</div>
                      {a.buyerRegistrationNumber && (
                        <div className="text-xs text-muted-foreground">{a.buyerRegistrationNumber}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.buyerContactPerson ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.buyerPhone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Monthly inspections bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Inspections (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyInspections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="compliant"     name="Compliant"     fill={BAR_COLORS.compliant}     radius={[4,4,0,0]} />
                <Bar dataKey="nonCompliant"  name="Non-Compliant" fill={BAR_COLORS.nonCompliant}  radius={[4,4,0,0]} />
                <Bar dataKey="investigation" name="Investigation" fill={BAR_COLORS.investigation} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inspection results pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inspection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={inspPieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {inspPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Recent inspections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item / Business</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No inspections yet</td></tr>
                ) : recentInspections.map((ins) => (
                  <tr key={ins.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{ins.itemName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{ins.businessName ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ins.district ?? ins.location ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={ins.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;