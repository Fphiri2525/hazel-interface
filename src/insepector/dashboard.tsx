import * as React from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardCheck,
  AlertTriangle,
  ScanSearch,
  Calendar,
  MapPin,
  Clock,
  User,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = "http://localhost:5000";
const USER_STORAGE_KEY = "mbs_user";

// ---------------------------------------------------------------------------
// Types — mirror the JSON shape returned by GET /api/inspections/summary
// ---------------------------------------------------------------------------
type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "INVESTIGATION_REQUIRED";

interface InspectionRow {
  id: number;
  batchId: string;
  itemName: string | null;
  businessName: string | null;
  district: string | null;
  location: string | null;
  inspectionDate: string;
  complianceStatus: ComplianceStatus;
  findings: string | null;
  actionTaken: string | null;
}

interface MonthlyTrendPoint {
  month: string;
  compliant: number;
  nonCompliant: number;
  investigation: number;
}

interface InspectionSummary {
  todayCount: number;
  monthCount: number;
  compliantCount: number;
  nonCompliantCount: number;
  investigationCount: number;
  totalCount: number;
  complianceRate: number;
  monthlyTrend: MonthlyTrendPoint[];
  recentActivity: InspectionRow[];
  recentNonCompliant: InspectionRow[];
}

interface StoredUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed as StoredUser;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, color = "text-primary" }) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`rounded-lg bg-muted p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  );
};

const ComplianceBadge: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  const config: Record<ComplianceStatus, { label: string; className: string; Icon: typeof CheckCircle }> = {
    COMPLIANT: {
      label: "Compliant",
      className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
      Icon: CheckCircle,
    },
    NON_COMPLIANT: {
      label: "Non-Compliant",
      className: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
      Icon: XCircle,
    },
    INVESTIGATION_REQUIRED: {
      label: "Investigation",
      className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      Icon: AlertTriangle,
    },
  };

  const { label, className, Icon } = config[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </span>
  );
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function InspectorDashboard() {
  const [user, setUser] = React.useState<StoredUser | null>(null);
  const [summary, setSummary] = React.useState<InspectionSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    setUser(readStoredUser());
  }, []);

  const fetchSummary = React.useCallback(async (inspectorId: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspections/summary?inspector_id=${inspectorId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to load summary (status ${res.status})`);
      }
      setSummary(data.summary as InspectionSummary);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) fetchSummary(user.id);
  }, [user, refreshKey, fetchSummary]);

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Please Log In</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be logged in to view your inspection summary.
        </p>
        <button
          onClick={() => (window.location.href = "/login")}
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your inspection activity and compliance summary
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-700 dark:text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {isLoading && !summary ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : summary ? (
        <>
          {/* Statistics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title="Inspections Today"
              value={summary.todayCount}
              icon={<ScanSearch className="h-5 w-5" />}
              description="Logged today"
            />
            <StatCard
              title="Compliant"
              value={summary.compliantCount}
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              description="Meeting standards"
              color="text-green-500"
            />
            <StatCard
              title="Non-Compliant"
              value={summary.nonCompliantCount}
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              description="Failed inspection"
              color="text-red-500"
            />
            <StatCard
              title="Investigation Required"
              value={summary.investigationCount}
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              description="Needs follow-up"
              color="text-amber-500"
            />
            <StatCard
              title="Inspections This Month"
              value={summary.monthCount}
              icon={<ClipboardCheck className="h-5 w-5" />}
              description="Total logged this month"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Inspection Activity - Takes 2/3 of the space */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Recent Inspection Activity</h2>
                  <button className="text-sm text-primary hover:underline">
                    View All <ChevronRight className="inline h-4 w-4" />
                  </button>
                </div>
                {summary.recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No inspections recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Date</th>
                          <th className="pb-3 pr-4 font-medium">Business</th>
                          <th className="pb-3 pr-4 font-medium">Item</th>
                          <th className="pb-3 pr-4 font-medium">District</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {summary.recentActivity.map((row) => (
                          <tr key={row.id} className="hover:bg-muted/50">
                            <td className="py-3 pr-4 text-foreground">{formatDate(row.inspectionDate)}</td>
                            <td className="py-3 pr-4 text-foreground">{row.businessName || "—"}</td>
                            <td className="py-3 pr-4 text-foreground">{row.itemName || "—"}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{row.district || "—"}</td>
                            <td className="py-3">
                              <ComplianceBadge status={row.complianceStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Inspector Performance Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Your Performance</h2>
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Inspections This Month</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{summary.monthCount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Inspections</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{summary.totalCount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">Investigations Open</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{summary.investigationCount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Compliance Rate</span>
                      <span className="ml-auto text-lg font-bold text-green-500">
                        {summary.complianceRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Compliance Trend */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Monthly Compliance Trend</h2>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              {summary.monthlyTrend.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Not enough history yet to show a trend.
                </p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                      <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="compliant" name="Compliant" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="investigation" name="Investigation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recently Found Non-Compliant */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recently Flagged Items</h2>
                <button className="text-sm text-primary hover:underline">
                  View All <ChevronRight className="inline h-4 w-4" />
                </button>
              </div>
              {summary.recentNonCompliant.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No non-compliant or flagged items recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.recentNonCompliant.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {row.itemName || "Unspecified item"}
                            </span>
                            {row.businessName && (
                              <span className="text-xs text-muted-foreground">{row.businessName}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {(row.location || row.district) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[row.location, row.district].filter(Boolean).join(", ")}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(row.inspectionDate)}
                            </span>
                          </div>
                        </div>
                        <ComplianceBadge status={row.complianceStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}