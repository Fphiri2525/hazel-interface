import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const Compliance = () => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/compliance`);
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
      <Loader2 className="h-5 w-5 animate-spin" /> Loading compliance data…
    </div>
  );
  if (error) return <div className="py-20 text-center text-sm text-destructive">{error}</div>;

  const { overall, complianceByCategory } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Compliance Monitoring</h1>
        <p className="text-sm text-muted-foreground">Food quality compliance across categories</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Overall Compliance</p>
            <p className="text-3xl font-bold text-success">{overall.overallPct}%</p>
            <Progress value={overall.overallPct} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">High Risk Categories</p>
            <p className="text-3xl font-bold text-destructive">
              {complianceByCategory.filter((c: any) => c.compliant < 75).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Categories Monitored</p>
            <p className="text-3xl font-bold text-foreground">{complianceByCategory.length}</p>
          </CardContent>
        </Card>
      </div>

      {complianceByCategory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Compliance by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={complianceByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis dataKey="category" type="category" width={140} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliant"    fill="hsl(142,60%,40%)" name="Compliant %"     radius={[0,4,4,0]} />
                <Bar dataKey="nonCompliant" fill="hsl(0,84%,60%)"   name="Non-Compliant %" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Category Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          {complianceByCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No inspection data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Total Inspections</th>
                  <th className="px-4 py-3 font-medium">Compliance Rate</th>
                  <th className="px-4 py-3 font-medium">Risk Level</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {complianceByCategory.map((c: any) => (
                  <tr key={c.category} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{c.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.total}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.compliant}%</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.compliant >= 85 ? "bg-success/10 text-success"      :
                        c.compliant >= 70 ? "bg-warning/10 text-warning"      :
                                            "bg-destructive/10 text-destructive"
                      }`}>
                        {c.compliant >= 85 ? "Low" : c.compliant >= 70 ? "Medium" : "High"}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-40"><Progress value={c.compliant} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;