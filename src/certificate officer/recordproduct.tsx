import * as React from "react";
import {
  Truck,
  Plus,
  RotateCcw,
  ClipboardList,
  AlertTriangle,
  Search,
  PackageSearch,
} from "lucide-react";

import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:5000";
const DISTRIBUTION_API_URL = `${API_BASE_URL}/api/record-distribution`;

const inputBase =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
  companyName: string | null; // returned by the existing GET route's JOIN on companies
  createdAt: string;
}

interface DistributionListResponse {
  success: boolean;
  count: number;
  distributions: DistributionListItem[];
}

interface DistributionResponse {
  success: boolean;
  message: string;
  distribution: DistributionListItem;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function SectionCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {step}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export interface RecordDistributionProps {
  onSave?: (record: DistributionListItem) => void;
  onCancel?: () => void;
}

export default function RecordDistribution({ onSave, onCancel }: RecordDistributionProps) {
  // ── Logged-in user (set by Login.tsx) ──
  const storedUser = React.useMemo(
    () => JSON.parse(localStorage.getItem("mbs_user") || "{}"),
    []
  );
  const loggedInEmail: string = storedUser?.email ?? "";
  const loggedInName: string = storedUser?.full_name ?? "";
  const loggedInCompanyName: string = storedUser?.company_name ?? "";
  // Company is fetched from the backend (GET /api/my-company) rather than
  // trusted from localStorage, since Login.tsx doesn't currently store
  const [view, setView] = React.useState<"list" | "form" | "saved">("list");

  const [distributions, setDistributions] = React.useState<DistributionListItem[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState("");
  const [batchSearch, setBatchSearch] = React.useState("");

  const [productName, setProductName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");
  const [transactionDate, setTransactionDate] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [invoiceReference, setInvoiceReference] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [buyerCompanyName, setBuyerCompanyName] = React.useState("");
  const [buyerRegistrationNumber, setBuyerRegistrationNumber] = React.useState("");
  const [buyerContactPerson, setBuyerContactPerson] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [destinationAddress, setDestinationAddress] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [savedRecord, setSavedRecord] = React.useState<DistributionListItem | null>(null);

  async function fetchDistributions() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      // Same route as before, unmodified — GET /api/record-distribution
      // returns every company's records with companyName attached.
      const response = await fetch(DISTRIBUTION_API_URL, { method: "GET" });
      const data: DistributionListResponse = await response.json();
      if (!response.ok || !data.success) {
        setHistoryError((data as any)?.error || "Failed to load distribution records.");
        setDistributions([]);
        return;
      }

      // Filter client-side to just this user's company, since the route
      // itself isn't scoped by company.
      const all = data.distributions || [];
      const scoped = loggedInCompanyName
        ? all.filter((d) => d.companyName === loggedInCompanyName)
        : all;

      setDistributions(scoped);
    } catch (err) {
      setHistoryError("Could not reach the server. Please try again.");
      setDistributions([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function openList() {
    setView("list");
    fetchDistributions();
  }

  function openForm() {
    setView("form");
  }

  React.useEffect(() => {
    fetchDistributions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setProductName("");
    setCategory("");
    setBatchNumber("");
    setExpiryDate("");
    setQuantity("");
    setUnitPrice("");
    setTransactionDate("");
    setDeliveryDate("");
    setInvoiceReference("");
    setNotes("");
    setBuyerCompanyName("");
    setBuyerRegistrationNumber("");
    setBuyerContactPerson("");
    setBuyerPhone("");
    setDestinationAddress("");
    setSubmitError("");
  }

  function startNew() {
    resetForm();
    setSavedRecord(null);
    setView("form");
  }

  const canSubmit =
    !!productName.trim() &&
    !!batchNumber.trim() &&
    !!expiryDate &&
    !!quantity &&
    Number(quantity) > 0 &&
    !!transactionDate &&
    !!buyerCompanyName.trim() &&
    !!destinationAddress.trim() &&
    !!loggedInEmail &&
    !submitting;

  async function recordSale() {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      email: loggedInEmail,
      productName,
      category,
      batchNumber,
      expiryDate,
      quantity: Number(quantity),
      unitPrice: unitPrice ? Number(unitPrice) : null,
      transactionDate,
      deliveryDate,
      invoiceReference,
      notes,
      buyerCompanyName,
      buyerRegistrationNumber,
      buyerContactPerson,
      buyerPhone,
      destinationAddress,
    };

    try {
      const response = await fetch(DISTRIBUTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: DistributionResponse = await response.json();

      if (!response.ok) {
        setSubmitError((data as any)?.error || "Failed to record the sale.");
        setSubmitting(false);
        return;
      }

      setSavedRecord(data.distribution);
      setView("saved");
      onSave?.(data.distribution);
    } catch (err) {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Saved confirmation ──
  if (view === "saved" && savedRecord) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Sale recorded
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {savedRecord.productName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Batch {savedRecord.batchNumber} &middot; {savedRecord.sellerCompany} sold to{" "}
                {savedRecord.buyerCompanyName}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-primary/20 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Quantity sold</dt>
              <dd className="text-foreground">{savedRecord.quantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Expiry date</dt>
              <dd className="text-foreground">{savedRecord.expiryDate || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Transaction date</dt>
              <dd className="text-foreground">{savedRecord.transactionDate}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Destination</dt>
              <dd className="text-foreground">{savedRecord.destinationAddress}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Record another sale
          </button>
          <button
            type="button"
            onClick={openList}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ClipboardList className="h-4 w-4" />
            View distribution records
          </button>
        </div>
      </div>
    );
  }

  // ── List / traceability view ──
  if (view === "list") {
    const filtered = distributions.filter((d) =>
      batchSearch.trim()
        ? d.batchNumber.toLowerCase().includes(batchSearch.trim().toLowerCase())
        : true
    );

    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Distribution records</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loggedInCompanyName
                ? `Sales recorded by ${loggedInCompanyName}. Search by batch number to trace stock.`
                : "Every sale of a certified product to another company. Search by batch number to trace where stock went during an alert."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchDistributions}
              disabled={historyLoading}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw className={cn("h-4 w-4", historyLoading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openForm}
              className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Record sale
            </button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={cn(inputBase, "pl-9")}
            placeholder="Search by batch number…"
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
          />
        </div>

        {historyError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{historyError}</span>
          </div>
        )}

        {historyLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            Loading distribution records…
          </div>
        )}

        {!historyLoading && !historyError && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-10 text-center shadow-sm">
            <PackageSearch className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {batchSearch
                ? `No distribution records match batch "${batchSearch}".`
                : "No sales have been recorded yet."}
            </p>
          </div>
        )}

        {!historyLoading && !historyError && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Batch</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Seller</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Sold to</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Destination</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{d.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{d.batchNumber}</td>
                    <td className="px-4 py-3 text-foreground">{d.expiryDate || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{d.companyName || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{d.sellerCompany}</td>
                    <td className="px-4 py-3 text-foreground">{d.buyerCompanyName}</td>
                    <td className="px-4 py-3 text-foreground">{d.destinationAddress}</td>
                    <td className="px-4 py-3 text-foreground">{d.quantity}</td>
                    <td className="px-4 py-3 text-foreground">
                      {new Date(d.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {d.recordedBy?.name || d.recordedBy?.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Form: record a new sale ──
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Record Sale / Distribution</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record the product that was sold and who it was sold to — so it can be traced by its
            expiry date if an alert comes up.
          </p>
        </div>
        <button
          type="button"
          onClick={openList}
          className="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ClipboardList className="h-4 w-4" />
          Back to records
        </button>
      </div>

      {!loggedInEmail && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>No logged-in session found. Please log in before recording a sale.</span>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <SectionCard step={1} title="Product sold">
        <div>
          <FieldLabel>Product name *</FieldLabel>
          <input
            className={inputBase}
            placeholder="e.g. Amoxicillin 500mg Capsules"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <input
            className={inputBase}
            placeholder="e.g. Antibiotic"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Batch number *</FieldLabel>
          <input
            className={inputBase}
            placeholder="e.g. B24-0117"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Expiry date *</FieldLabel>
          <input
            type="date"
            className={inputBase}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Quantity sold *</FieldLabel>
          <input
            type="number"
            min="1"
            className={inputBase}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Unit price (optional)</FieldLabel>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputBase}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Transaction date *</FieldLabel>
          <input type="date" className={inputBase} value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Expected delivery date</FieldLabel>
          <input type="date" className={inputBase} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Invoice reference</FieldLabel>
          <input className={inputBase} value={invoiceReference} onChange={(e) => setInvoiceReference(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Notes</FieldLabel>
          <textarea
            className={cn(inputBase, "min-h-[72px] resize-y")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard step={2} title="Buyer / receiving company">
        <div>
          <FieldLabel>Buyer company name *</FieldLabel>
          <input className={inputBase} value={buyerCompanyName} onChange={(e) => setBuyerCompanyName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Buyer registration number</FieldLabel>
          <input className={inputBase} value={buyerRegistrationNumber} onChange={(e) => setBuyerRegistrationNumber(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Contact person</FieldLabel>
          <input className={inputBase} value={buyerContactPerson} onChange={(e) => setBuyerContactPerson(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Contact phone</FieldLabel>
          <input className={inputBase} value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Destination address *</FieldLabel>
          <input
            className={inputBase}
            placeholder="Where the goods are being delivered to"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard step={3} title="Recorded by">
        <div className="sm:col-span-2">
          <FieldLabel>Recording officer</FieldLabel>
          <input
            className={cn(inputBase, "bg-muted/50 text-muted-foreground")}
            value={loggedInName ? `${loggedInName} (${loggedInEmail})` : loggedInEmail || "Not logged in"}
            disabled
          />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={recordSale}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Truck className="h-4 w-4" />
          {submitting ? "Saving…" : "Record sale"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}