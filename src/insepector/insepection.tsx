import * as React from "react";
import {
  Calendar,
  User,
  MapPin,
  Building2,
  Store,
  Hash,
  Tag,
  FileText,
  CheckCircle,
  Camera,
  Save,
  Plus,
  X,
  Image,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from './usecurrentstate';

const API_BASE_URL = "http://localhost:5000";

type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "INVESTIGATION_REQUIRED" | "";

interface InspectionPhoto {
  id: number;
  inspection_id: number;
  photo_path: string;
  created_at?: string;
}

interface Inspection {
  id: number;
  inspector_id: number;
  batch_id: string;
  item_name: string | null;
  business_name: string | null;
  district: string | null;
  location: string | null;
  inspection_date: string;
  compliance_status: ComplianceStatus;
  findings: string | null;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
  photos: InspectionPhoto[];
}

interface InspectionFormData {
  inspector_id: string;
  batch_id: string;
  item_name: string;
  business_name: string;
  district: string;
  location: string;
  inspection_date: string;
  compliance_status: ComplianceStatus;
  findings: string;
  action_taken: string;
  photos: File[];
}

const getInitialFormData = (userId: number): InspectionFormData => ({
  inspector_id: String(userId),
  batch_id: "",
  item_name: "",
  business_name: "",
  district: "",
  location: "",
  inspection_date: new Date().toISOString().split("T")[0],
  compliance_status: "",
  findings: "",
  action_taken: "",
  photos: [],
});

const ComplianceBadge: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  const config = {
    COMPLIANT: { label: "Compliant", class: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" },
    NON_COMPLIANT: { label: "Non-Compliant", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30" },
    INVESTIGATION_REQUIRED: { label: "Investigation", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" },
    "": { label: "—", class: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[status] ?? config[""];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap", c.class)}>
      {c.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Photo Upload
// ---------------------------------------------------------------------------
const PhotoUpload: React.FC<{ files: File[]; onFilesChange: (f: File[]) => void; maxSize?: number }> = ({
  files, onFilesChange, maxSize = 10,
}) => {
  const ref = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size / 1024 / 1024 <= maxSize);
    if (valid.length !== selected.length) alert(`Some files exceed ${maxSize}MB and were skipped.`);
    onFilesChange([...files, ...valid]);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => ref.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-5 transition-all hover:border-primary hover:bg-muted/50"
      >
        <input ref={ref} type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
        <Image className="mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Click to upload photos</p>
        <p className="text-xs text-muted-foreground">Max {maxSize}MB per file</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{f.name}</span>
              <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => onFilesChange(files.filter((_, j) => j !== i))} className="rounded p-0.5 hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Expanded Row — shown inline below a table row
// ---------------------------------------------------------------------------
const ExpandedRow: React.FC<{ inspection: Inspection; colSpan: number }> = ({ inspection, colSpan }) => (
  <tr className="bg-muted/30">
    <td colSpan={colSpan} className="px-6 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inspection.findings && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Findings</p>
            <p className="text-sm text-foreground">{inspection.findings}</p>
          </div>
        )}
        {inspection.action_taken && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action Taken</p>
            <p className="text-sm text-foreground">{inspection.action_taken}</p>
          </div>
        )}
        {inspection.photos.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Photos ({inspection.photos.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {inspection.photos.map(photo => (
                <img
                  key={photo.id}
                  src={`${API_BASE_URL}${photo.photo_path}`}
                  alt="Evidence"
                  className="h-16 w-16 rounded-md border border-border object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder-image.png"; }}
                />
              ))}
            </div>
          </div>
        )}
        {!inspection.findings && !inspection.action_taken && inspection.photos.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No additional details recorded.</p>
        )}
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------------------------
// Table Row
// ---------------------------------------------------------------------------
const InspectionRow: React.FC<{ inspection: Inspection }> = ({ inspection }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasDetails = inspection.findings || inspection.action_taken || inspection.photos.length > 0;

  return (
    <>
      <tr
        className={cn(
          "border-b border-border transition-colors",
          expanded ? "bg-muted/20" : "hover:bg-muted/40",
          hasDetails && "cursor-pointer"
        )}
        onClick={() => hasDetails && setExpanded(p => !p)}
      >
        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
          {inspection.batch_id}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-foreground">{inspection.item_name || <span className="text-muted-foreground italic">—</span>}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">{inspection.business_name || <span className="text-muted-foreground italic">—</span>}</p>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {inspection.district || "—"}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {inspection.location || "—"}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {new Date(inspection.inspection_date).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {inspection.inspector_id}
        </td>
        <td className="px-4 py-3">
          <ComplianceBadge status={inspection.compliance_status} />
        </td>
        <td className="px-4 py-3 text-center">
          {hasDetails ? (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
              aria-label={expanded ? "Collapse row" : "Expand row"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetails && <ExpandedRow inspection={inspection} colSpan={9} />}
    </>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function MarketInspections() {
  const { user, loading: userLoading } = useCurrentUser();

  const [formData, setFormData] = React.useState<InspectionFormData>(() => getInitialFormData(0));
  const [inspections, setInspections] = React.useState<Inspection[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (user) setFormData(prev => ({ ...prev, inspector_id: String(user.id) }));
  }, [user]);

  React.useEffect(() => {
    if (!userLoading) fetchInspections();
  }, [refreshKey, userLoading]);

  const fetchInspections = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspections`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      setInspections(await res.json());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load inspections");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.batch_id.trim() !== "" && formData.inspection_date !== "" && formData.compliance_status !== "";

  const handleAddInspection = async () => {
    if (!isFormValid) { setErrorMessage("Batch ID, Inspection Date, and Compliance Status are required."); return; }
    if (formData.batch_id.length > 100) { setErrorMessage("Batch ID must be 100 characters or fewer."); return; }
    if (!user) { setErrorMessage("You must be logged in to create an inspection."); return; }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === "photos") (v as File[]).forEach(f => body.append("photos", f));
        else body.append(k, v as string);
      });
      const res = await fetch(`${API_BASE_URL}/api/inspections`, { method: "POST", body });
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.message || `Status ${res.status}`); }
      setIsSaved(true);
      setFormData(getInitialFormData(user.id));
      setIsFormOpen(false);
      setRefreshKey(p => p + 1);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save inspection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Discard this inspection?")) {
      if (user) setFormData(getInitialFormData(user.id));
      setErrorMessage(null);
      setIsFormOpen(false);
    }
  };

  if (userLoading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!user) return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <User className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">Please Log In</h3>
      <p className="mt-2 text-sm text-muted-foreground">You need to be logged in to view and create inspections.</p>
      <button onClick={() => window.location.href = "/login"} className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Go to Login
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Inspections</h1>
          <p className="text-sm text-muted-foreground">Record and review batch inspection findings across markets and establishments</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey(p => p + 1)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Inspection
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {isSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm font-medium text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Inspection saved successfully.
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-700 dark:text-red-400">
          <X className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TABLE VIEW                                                           */}
      {/* ------------------------------------------------------------------ */}
      {!isFormOpen && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Table summary bar */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${inspections.length} inspection${inspections.length !== 1 ? "s" : ""} recorded`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">District</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector ID</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                    </td>
                  </tr>
                ) : inspections.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium text-foreground">No inspections yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Click "Add Inspection" to record the first one.</p>
                    </td>
                  </tr>
                ) : (
                  inspections.map(inspection => (
                    <InspectionRow key={inspection.id} inspection={inspection} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* INSPECTION FORM                                                      */}
      {/* ------------------------------------------------------------------ */}
      {isFormOpen && (
        <form className="space-y-5" onSubmit={e => e.preventDefault()}>
          {/* Inspector info banner */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-foreground">
              Logged in as <span className="font-medium">{user.email}</span>
              <span className="ml-2 text-muted-foreground">(ID: {user.id})</span>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            {/* Section: Core details */}
            <div className="border-b border-border px-6 py-4">
              <div className="mb-1 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Inspection Details</h2>
              </div>
              <p className="text-xs text-muted-foreground">Fields marked <span className="text-destructive">*</span> are required</p>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Batch ID — varchar(100), not numeric */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Batch ID <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    placeholder="e.g. BATCH-1042 or 1042"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Item Name</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Cooking oil, maize flour"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Inspection Date <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" name="inspection_date" value={formData.inspection_date} onChange={handleInputChange} required
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>

              {/* Compliance Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Compliance Status <span className="text-destructive">*</span></label>
                <select name="compliance_status" value={formData.compliance_status} onChange={handleInputChange} required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
                  <option value="">Select status…</option>
                  <option value="COMPLIANT">Compliant</option>
                  <option value="NON_COMPLIANT">Non-Compliant</option>
                  <option value="INVESTIGATION_REQUIRED">Investigation Required</option>
                </select>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Business Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="Shop / business name"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">District</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="e.g. Lilongwe"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Location</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Specific address or area"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Findings + Action — full width */}
            <div className="grid gap-4 border-t border-border px-6 py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Findings
                </label>
                <textarea name="findings" value={formData.findings} onChange={handleInputChange} rows={4}
                  placeholder="Describe what was found during the inspection…"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Action Taken</label>
                <textarea name="action_taken" value={formData.action_taken} onChange={handleInputChange} rows={4}
                  placeholder="e.g. Warning issued, product seized, investigation opened…"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" />
              </div>
            </div>

            {/* Photos */}
            <div className="border-t border-border px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Evidence Photos</h3>
              </div>
              <PhotoUpload files={formData.photos} onFilesChange={photos => setFormData(p => ({ ...p, photos }))} maxSize={10} />
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
              <button
                type="button"
                onClick={handleAddInspection}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Inspection</>}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}