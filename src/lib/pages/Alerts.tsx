import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, Clock, MapPin, Building2, CheckCircle, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const ICON_MAP: Record<string, any> = {
  expiring_product:  Clock,
  failed_inspection: AlertTriangle,
};

function DaysBadge({ daysLeft }: { daysLeft?: number }) {
  if (daysLeft === undefined || daysLeft === null) return null;
  if (daysLeft < 0) {
    return (
      <span className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
        Expired {Math.abs(daysLeft)} day(s) ago
      </span>
    );
  }
  const color =
    daysLeft <= 7  ? "bg-red-100 text-red-700"     :
    daysLeft <= 30 ? "bg-amber-100 text-amber-700" :
                      "bg-yellow-50 text-yellow-700";
  return (
    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {daysLeft} day(s) remaining
    </span>
  );
}

const Alerts = () => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/alerts`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load");
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading alerts…
    </div>
  );

  if (error) return (
    <div className="py-20 text-center text-sm text-destructive">{error}</div>
  );

  const { counts, alerts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground">{counts.total} active alerts</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Expiring / Expired Products</p>
              <p className="text-xl font-bold text-foreground">{counts.expiringProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Failed Inspections</p>
              <p className="text-xl font-bold text-foreground">{counts.failedInspections}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 p-8">
              <CheckCircle className="h-6 w-6 text-success" />
              <p className="text-muted-foreground">No active alerts</p>
            </CardContent>
          </Card>
        ) : alerts.map((alert: any, i: number) => {
          const Icon = ICON_MAP[alert.category] ?? Bell;
          return (
            <Card
              key={i}
              className={`border-l-4 ${alert.type === "danger" ? "border-l-destructive" : "border-l-warning"}`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${
                  alert.type === "danger" ? "text-destructive" : "text-warning"
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.detail}</p>

                  {/* Location + buyer, shown explicitly for expiring products */}
                  {(alert.location || alert.buyer) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {alert.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {alert.location}
                        </span>
                      )}
                      {alert.buyer && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {alert.category === "expiring_product" ? "Bought by " : "Business: "}
                          {alert.buyer}
                        </span>
                      )}
                    </div>
                  )}

                  <DaysBadge daysLeft={alert.daysLeft} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;