import * as React from "react";
import { ShieldCheck, XCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { fetchProductStats, type ProductStats } from './productStats';

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

export default function ProductDecision() {
  const [stats, setStats] = React.useState<ProductStats>({
    total: 0,
    certified: 0,
    rejected: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setError("");
      try {
        const { stats: nextStats } = await fetchProductStats();
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
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total Records" value={stats.total} loading={loading} />
        <StatCard
          label="Certified"
          value={stats.certified}
          tone="primary"
          loading={loading}
          icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          tone="destructive"
          loading={loading}
          icon={<XCircle className="h-6 w-6 text-destructive" />}
        />
      </div>
    </div>
  );
}