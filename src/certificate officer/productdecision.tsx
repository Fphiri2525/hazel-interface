import * as React from "react";
import { Truck, Package, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchDistributionStats, type DistributionStats } from './productStats';

function StatCard({
  label,
  value,
  tone = "default",
  icon,
  loading,
}: {
  label: string;
  value: number;
  tone?: "default" | "primary" | "destructive";
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-7 py-7 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <p
        className={cn(
          "mt-3 text-4xl font-bold",
          tone === "primary" && "text-primary",
          tone === "destructive" && "text-destructive",
          tone === "default" && "text-foreground"
        )}
      >
        {loading ? "—" : value}
      </p>
    </div>
  );
}

export default function DistributionSummary() {
  const storedUser = React.useMemo(
    () => JSON.parse(localStorage.getItem("mbs_user") || "{}"),
    []
  );
  const loggedInCompanyName: string = storedUser?.company_name ?? "";

  const [stats, setStats] = React.useState<DistributionStats>({
    totalRecords: 0,
    totalQuantity: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setError("");
      try {
        const { stats: nextStats } = await fetchDistributionStats(loggedInCompanyName);
        if (isMounted) setStats(nextStats);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Could not reach the server. Please try again."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInCompanyName]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Total Records"
          value={stats.totalRecords}
          loading={loading}
          icon={<Truck className="h-6 w-6 text-muted-foreground" />}
        />
        <StatCard
          label="Total Quantity Distributed"
          value={stats.totalQuantity}
          tone="primary"
          loading={loading}
          icon={<Package className="h-6 w-6 text-primary" />}
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiringSoon}
          tone="destructive"
          loading={loading}
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        />
      </div>
    </div>
  );
}