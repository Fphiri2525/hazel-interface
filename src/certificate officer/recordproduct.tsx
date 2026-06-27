import * as React from "react";
import {
  ShieldCheck,
  XCircle,
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  ClipboardList,
  AlertTriangle,
  Download,
} from "lucide-react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/record-product`;

const inputBase =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export interface ProductDecisionRecord {
  id: string;
  savedAt: string;
  productName: string;
  brandName: string;
  batchNumber: string;
  mbsReferenceNumber: string;
  decisionDate: string;
  decisionStatus: "Certified" | "Rejected" | "";
}

interface TestParameter {
  id: string;
  name: string;
  result: string;
  unit: string;
  threshold: string;
}

interface ProductResponse {
  success: boolean;
  message: string;
  product: {
    id: number;
    productName: string;
    category: string;
    productType: string;
    barcode: string;
    qrCode: string;
    createdAt: string;
    manufacturerId: number;
    batchId: number;
    decision: string;
    certificate: {
      certificateId: string;
      mbsReferenceNumber: string;
      issueDate: string;
      certExpiryDate: string;
      barcodeValue: string;
      qrCodeValue: string;
    } | null;
  };
  officerId: number;
}

// Shape returned by GET /api/record-product (list endpoint)
interface ProductListItem {
  id: number;
  productName: string;
  category: string;
  productType: string;
  barcode: string;
  qrCode: string;
  createdAt: string;
  manufacturer: {
    name: string;
    registrationNumber: string | null;
  };
  batch: {
    batchNumber: string;
    quantity: number | null;
    productionDate: string | null;
    expiryDate: string | null;
    packagingType: string | null;
  };
  decision: {
    status: "APPROVED" | "REJECTED" | string | null;
    date: string | null;
    officer: {
      name: string | null;
      email: string | null;
    };
    remarks: {
      rejectionReason?: string | null;
      resubmittable?: boolean;
      sample?: Record<string, unknown>;
      test?: Record<string, unknown>;
    };
  };
  certificate: {
    certificateNumber: string;
    issueDate: string | null;
    expiryDate: string | null;
    status: string | null;
    barcodeValue: string | null;
    qrCodeValue: string | null;
  } | null;
}

interface ProductListResponse {
  success: boolean;
  count: number;
  products: ProductListItem[];
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

function genId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

// Real, scannable QR code — encodes the exact value passed in (e.g. productQrCode)
// so scanning it returns that same code/number, not a decorative pattern.
const RealQRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 150 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#1b1b1b", light: "#ffffff" },
    }).catch(() => {
      // Swallow render errors (e.g. empty/invalid value) — canvas stays blank.
    });
  }, [value, size]);

  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 text-center text-[11px] text-muted-foreground"
      >
        QR not generated yet
      </div>
    );
  }

  return <canvas ref={canvasRef} width={size} height={size} />;
};

// ── MBS emblem, recreated in SVG: green/red arc with shield-check mark ──
const MbsEmblem: React.FC<{ size?: number }> = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="mx-auto">
    <path
      d="M 14 58 A 36 36 0 0 1 86 58"
      fill="none"
      stroke="#c1272d"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 18 30 A 36 36 0 0 1 82 30"
      fill="none"
      stroke="#1b6b3a"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="50" cy="50" r="26" fill="#0e5b33" />
    <path
      d="M37 50 L46 60 L65 38"
      fill="none"
      stroke="#fff"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface RecordProductProps {
  onSave?: (record: ProductDecisionRecord) => void;
  onCancel?: () => void;
}

export default function RecordProduct({ onSave, onCancel }: RecordProductProps) {
  // ── Read logged-in user from localStorage (set by Login.tsx) ──
  const storedUser = React.useMemo(
    () => JSON.parse(localStorage.getItem("mbs_user") || "{}"),
    []
  );
  const loggedInEmail: string = storedUser?.email ?? "";
  const loggedInName: string = storedUser?.full_name ?? "";

  // Section 1 — Producer / manufacturer
  const [producerName, setProducerName] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [producerAddress, setProducerAddress] = React.useState("");
  const [contactNumber, setContactNumber] = React.useState("");
  const [facilityLocation, setFacilityLocation] = React.useState("");

  // Section 2 — Product
  const [productName, setProductName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [productType, setProductType] = React.useState<"" | "LOCAL" | "IMPORTED">("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [productionDate, setProductionDate] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [packaging, setPackaging] = React.useState("");

  // Section 3 — Sample
  const [sampleReceivedDate, setSampleReceivedDate] = React.useState("");
  const [collectedBy, setCollectedBy] = React.useState("");
  const [collectionLocation, setCollectionLocation] = React.useState("");

  // Section 4 — Test
  const [standard, setStandard] = React.useState("");
  const [testType, setTestType] = React.useState("");
  const [testMethod, setTestMethod] = React.useState("");
  const [testCompletedDate, setTestCompletedDate] = React.useState("");
  const [parameters, setParameters] = React.useState<TestParameter[]>([
    { id: genId("PARAM"), name: "", result: "", unit: "", threshold: "" },
  ]);

  // Section 5 — Result & decision
  const [decision, setDecision] = React.useState<"" | "Certified" | "Rejected">("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [resubmittable, setResubmittable] = React.useState(true);

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [locked, setLocked] = React.useState(false);

  // Section 6 — server-generated output
  const [certificateId, setCertificateId] = React.useState("");
  const [mbsReferenceNumber, setMbsReferenceNumber] = React.useState("");
  const [issueDate, setIssueDate] = React.useState("");
  const [certExpiryDate, setCertExpiryDate] = React.useState("");

  // NEW: QR and Barcode from product
  const [productBarcode, setProductBarcode] = React.useState("");
  const [productQrCode, setProductQrCode] = React.useState("");
  const [certificateBarcode, setCertificateBarcode] = React.useState("");
  const [certificateQrCode, setCertificateQrCode] = React.useState("");
  const [productId, setProductId] = React.useState<number | null>(null);

  // ── View mode: the form, the locked confirmation, or the products list ──
  const [view, setView] = React.useState<"form" | "locked" | "list">("list");

  // ── Products list (GET /api/record-product) ──
  const [products, setProducts] = React.useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productsError, setProductsError] = React.useState("");
  const [listFilter, setListFilter] = React.useState<"ALL" | "APPROVED" | "REJECTED">("ALL");

  // ── Ref to the certificate frame, used to snapshot it into a PDF ──
  const certificateRef = React.useRef<HTMLDivElement | null>(null);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);

  async function fetchProducts() {
    setProductsLoading(true);
    setProductsError("");
    try {
      const response = await fetch(API_URL, { method: "GET" });
      const data: ProductListResponse = await response.json();
      if (!response.ok || !data.success) {
        setProductsError((data as any)?.error || "Failed to load products.");
        setProducts([]);
        return;
      }
      setProducts(data.products || []);
    } catch (err) {
      setProductsError("Could not reach the server. Please try again.");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  function openProductsList() {
    setView("list");
    fetchProducts();
  }

  // Load the products table immediately on mount, since it's the landing view.
  React.useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadCertificatePdf() {
    if (!certificateRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    setSubmitError("");
    try {
      // Dynamic imports: keeps these optional packages from breaking the dev
      // server / build if they haven't been installed yet (run:
      //   npm install html2canvas jspdf
      // to enable PDF download).
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#fbfbf8",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      // Fit the snapshot onto an A4 portrait page, centered with a small margin.
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      const imgRatio = canvas.height / canvas.width;
      let renderWidth = maxWidth;
      let renderHeight = renderWidth * imgRatio;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = renderHeight / imgRatio;
      }
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);

      const fileSafeRef = (mbsReferenceNumber || "certificate").replace(/[^a-zA-Z0-9-_]/g, "_");
      pdf.save(`MBS-Certificate-${fileSafeRef}.pdf`);
    } catch (err) {
      setSubmitError(
        "Could not generate the certificate PDF. Make sure html2canvas and jspdf are installed (npm install html2canvas jspdf), then try again."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  function addParameter() {
    setParameters((p) => [
      ...p,
      { id: genId("PARAM"), name: "", result: "", unit: "", threshold: "" },
    ]);
  }

  function removeParameter(id: string) {
    setParameters((p) => (p.length > 1 ? p.filter((row) => row.id !== id) : p));
  }

  function updateParameter(id: string, field: keyof TestParameter, value: string) {
    setParameters((p) =>
      p.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  const canSubmit =
    !!producerName &&
    !!productName &&
    !!category &&
    !!productType &&
    !!batchNumber &&
    !!decision &&
    !(decision === "Rejected" && !rejectionReason.trim()) &&
    !!loggedInEmail &&
    !submitting;

  async function recordDecision() {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      // ── Identity — backend resolves officer_id from this email ──
      email: loggedInEmail,

      // Section 1
      producerName,
      registrationNumber,
      producerAddress,
      contactNumber,
      facilityLocation,

      // Section 2
      productName,
      category,
      productType,
      batchNumber,
      quantity: quantity ? Number(quantity) : null,
      productionDate,
      expiryDate,
      packaging,

      // Section 3
      sampleReceivedDate,
      collectedBy,
      collectionLocation,

      // Section 4
      standard,
      testType,
      testMethod,
      testCompletedDate,
      parameters,

      // Section 5
      decision,
      rejectionReason,
      resubmittable,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ProductResponse = await response.json();

      if (!response.ok) {
        setSubmitError((data as any)?.error || "Failed to record product decision.");
        setSubmitting(false);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      // Store product QR and Barcode
      if (data.product) {
        setProductBarcode(data.product.barcode);
        setProductQrCode(data.product.qrCode);
        setProductId(data.product.id);

        if (data.product.certificate) {
          setCertificateId(data.product.certificate.certificateId);
          setMbsReferenceNumber(data.product.certificate.mbsReferenceNumber);
          setIssueDate(data.product.certificate.issueDate);
          setCertExpiryDate(data.product.certificate.certExpiryDate || "—");
          setCertificateBarcode(data.product.certificate.barcodeValue);
          setCertificateQrCode(data.product.certificate.qrCodeValue);
        }
      }

      setLocked(true);
      setView("locked");
      onSave?.({
        id: genId("REC"),
        savedAt: today,
        productName: productName || "—",
        brandName: producerName || "—",
        batchNumber: batchNumber || "—",
        mbsReferenceNumber: data.product?.certificate?.mbsReferenceNumber || "—",
        decisionDate: today,
        decisionStatus: decision,
      });
    } catch (err) {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNew() {
    // Reset every field instead of reloading the page, so "Start new record"
    // lands on a blank form rather than the products table (the new default view).
    setProducerName("");
    setRegistrationNumber("");
    setProducerAddress("");
    setContactNumber("");
    setFacilityLocation("");
    setProductName("");
    setCategory("");
    setProductType("");
    setBatchNumber("");
    setProductionDate("");
    setExpiryDate("");
    setQuantity("");
    setPackaging("");
    setSampleReceivedDate("");
    setCollectedBy("");
    setCollectionLocation("");
    setStandard("");
    setTestType("");
    setTestMethod("");
    setTestCompletedDate("");
    setParameters([{ id: genId("PARAM"), name: "", result: "", unit: "", threshold: "" }]);
    setDecision("");
    setRejectionReason("");
    setResubmittable(true);
    setSubmitError("");
    setCertificateId("");
    setMbsReferenceNumber("");
    setIssueDate("");
    setCertExpiryDate("");
    setProductBarcode("");
    setProductQrCode("");
    setCertificateBarcode("");
    setCertificateQrCode("");
    setProductId(null);
    setLocked(false);
    setView("form");
  }

  function handlePrint() {
    window.print();
  }

  // ── Locked / confirmation screen ──
  if (view === "locked" && decision) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {decision === "Certified" ? (
          // ───────────────────────────────────────────────────────
          // FORMAL CERTIFICATE — bordered frame, matches MBS template
          // ───────────────────────────────────────────────────────
          <div
            className="relative overflow-hidden rounded-[28px] border-[3px] border-[#0e5b33] bg-[#fbfbf8] p-2 shadow-md print:shadow-none"
          >
            {/* inner hairline border, echoes the notched-corner frame in the reference */}
            <div
              ref={certificateRef}
              className="relative rounded-[20px] border border-[#0e5b33]/70 px-8 py-10 sm:px-14 sm:py-12"
            >
              {/* faint watermark texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(115deg, #0e5b33 0px, #0e5b33 1px, transparent 1px, transparent 14px)",
                }}
              />

              {/* Emblem + heading */}
              <div className="relative text-center">
                <MbsEmblem size={84} />
                <p className="mt-2 text-[15px] font-bold tracking-tight text-[#0e5b33] sm:text-base">
                  MBS
                </p>
                <p className="text-[11px] font-semibold tracking-wide text-foreground/80">
                  MALAWI BUREAU OF STANDARDS
                </p>
                <p className="text-[11px] italic text-[#0e5b33]/80">
                  Standards for Quality Life
                </p>

                <div className="mx-auto my-5 flex items-center justify-center gap-3 text-[#0e5b33]/40">
                  <span className="h-px w-20 bg-[#0e5b33]/30 sm:w-28" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0e5b33]/50" />
                  <span className="h-px w-20 bg-[#0e5b33]/30 sm:w-28" />
                </div>

                <h2 className="text-3xl font-extrabold uppercase tracking-wide text-[#0e5b33] sm:text-4xl">
                  Certificate
                </h2>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/70 sm:text-base">
                  of Approval
                </p>

                <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-foreground/80">
                  This is to certify that the product listed below has been
                  assessed and found to comply with Malawi Bureau of Standards
                  requirements.
                </p>

                {/* Approval stamp */}
                <div className="mt-6 flex flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0e5b33]">
                    <ShieldCheck className="h-7 w-7 text-[#0e5b33]" />
                  </span>
                  <p className="mt-2 text-lg font-extrabold tracking-wide text-[#0e5b33]">
                    APPROVED
                  </p>
                  <p className="text-[11px] font-semibold tracking-[0.25em] text-foreground/60">
                    SAFE · QUALITY · COMPLIANT
                  </p>
                </div>
              </div>

              {/* Details + QR row */}
              <div className="relative mt-9 grid grid-cols-1 gap-8 sm:grid-cols-[1.3fr_auto_1fr] sm:items-start">
                {/* Left: labeled detail lines */}
                <dl className="space-y-3.5 text-sm">
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Product:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 text-foreground">
                      {productName || "\u00A0"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Certificate No.:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 font-mono text-foreground">
                      {mbsReferenceNumber || "\u00A0"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Date Issued:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 text-foreground">
                      {issueDate || "\u00A0"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Valid Until:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 text-foreground">
                      {certExpiryDate || "\u00A0"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Producer:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 text-foreground">
                      {producerName || "\u00A0"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 font-semibold uppercase tracking-wide text-[#0e5b33]">
                      Batch No.:
                    </dt>
                    <dd className="flex-1 truncate border-b border-foreground/30 pb-0.5 text-foreground">
                      {batchNumber || "\u00A0"}
                    </dd>
                  </div>
                </dl>

                {/* Vertical divider, hidden on mobile */}
                <span className="hidden h-full w-px bg-[#0e5b33]/25 sm:block" />

                {/* Right: QR code */}
                <div className="flex flex-col items-center justify-self-center">
                  <div className="rounded-xl border-2 border-[#0e5b33] bg-white p-3 shadow-sm">
                    <RealQRCode value={productQrCode} size={132} />
                  </div>
                  <span className="mt-3 inline-flex items-center rounded-full bg-[#0e5b33] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Scan to Verify
                  </span>
                </div>
              </div>

              {/* Footer seal line */}
              <div className="relative mt-9 flex flex-col items-center border-t border-[#0e5b33]/25 pt-6 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0e5b33]/60 text-[#0e5b33]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="mt-2 text-xs text-foreground/70">
                  This certificate is digitally issued and valid.
                </p>
                <p className="text-[11px] font-semibold tracking-[0.25em] text-[#0e5b33]">
                  VERIFY · TRUST · QUALITY
                </p>
              </div>
            </div>

            <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2 print:hidden">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Active
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={downloadCertificatePdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // ───────────────────────────────────────────────────────
          // REJECTION VIEW — unchanged, kept simple as before
          // ───────────────────────────────────────────────────────
          <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                  Rejection Record
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {productName || "Product"}
                </h2>
                <p className="text-sm text-muted-foreground">{producerName}</p>
              </div>
              <XCircle className="h-9 w-9 shrink-0 text-destructive" />
            </div>

            <div className="mt-5 space-y-3 border-t border-destructive/20 pt-5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Reason for rejection</p>
                <p className="text-foreground">{rejectionReason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resubmittable after correction</p>
                <p className="text-foreground">{resubmittable ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Start new record
          </button>
          <button
            type="button"
            onClick={openProductsList}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ClipboardList className="h-4 w-4" />
            View all products
          </button>
        </div>
      </div>
    );
  }

  // ── Products list view (table) ──
  if (view === "list") {
    const filteredProducts = products.filter((p) => {
      if (listFilter === "ALL") return true;
      return p.decision?.status === listFilter;
    });

    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Recorded products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every product decision recorded by inspecting officers.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchProducts}
              disabled={productsLoading}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw className={cn("h-4 w-4", productsLoading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setView("form")}
              className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Record Product
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {(["ALL", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setListFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                listFilter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "ALL" ? "All" : f === "APPROVED" ? "Approved" : "Rejected"}
            </button>
          ))}
        </div>

        {productsError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{productsError}</span>
          </div>
        )}

        {productsLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            Loading products…
          </div>
        )}

        {!productsLoading && !productsError && filteredProducts.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            No products found{listFilter !== "ALL" ? ` for "${listFilter.toLowerCase()}"` : ""}.
          </div>
        )}

        {!productsLoading && !productsError && filteredProducts.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Producer</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Batch</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Officer</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Certificate No.</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isApproved = p.decision?.status === "APPROVED";
                  const isRejected = p.decision?.status === "REJECTED";
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{p.productName}</td>
                      <td className="px-4 py-3 text-foreground">{p.manufacturer?.name || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{p.batch?.batchNumber || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{p.category || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{p.productType || "—"}</td>
                      <td className="px-4 py-3 text-foreground">
                        {p.decision?.officer?.name || p.decision?.officer?.email || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {p.certificate?.certificateNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {p.decision?.date ? new Date(p.decision.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#0e5b33]/10 px-2.5 py-0.5 text-xs font-medium text-[#0e5b33]">
                            <ShieldCheck className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                        {!isApproved && !isRejected && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Form ──
  if (view !== "form") return null;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Record Product</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log inspection and test results, then approve or reject the batch.
          </p>
        </div>
        <button
          type="button"
          onClick={openProductsList}
          className="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ClipboardList className="h-4 w-4" />
          Back to products
        </button>
      </div>

      {/* Warn if no session found */}
      {!loggedInEmail && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>No logged-in session found. Please log in before recording a decision.</span>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <SectionCard step={1} title="Producer / Manufacturer">
        <div>
          <FieldLabel>Producer name *</FieldLabel>
          <input className={inputBase} value={producerName} onChange={(e) => setProducerName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Registration / business number</FieldLabel>
          <input className={inputBase} value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Physical address</FieldLabel>
          <input className={inputBase} value={producerAddress} onChange={(e) => setProducerAddress(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Contact number</FieldLabel>
          <input className={inputBase} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Production facility location (if different)</FieldLabel>
          <input className={inputBase} value={facilityLocation} onChange={(e) => setFacilityLocation(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard step={2} title="Product Details">
        <div>
          <FieldLabel>Product name *</FieldLabel>
          <input className={inputBase} value={productName} onChange={(e) => setProductName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Category *</FieldLabel>
          <input className={inputBase} placeholder="e.g. dairy, packaged water" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Product type *</FieldLabel>
          <select
            className={inputBase}
            value={productType}
            onChange={(e) => setProductType(e.target.value as "" | "LOCAL" | "IMPORTED")}
          >
            <option value="">Select type…</option>
            <option value="LOCAL">Local</option>
            <option value="IMPORTED">Imported</option>
          </select>
        </div>
        <div>
          <FieldLabel>Batch / lot number *</FieldLabel>
          <input className={inputBase} value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Quantity represented by batch</FieldLabel>
          <input
            type="number"
            min="0"
            className={inputBase}
            placeholder="e.g. 5000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Packaging type / size</FieldLabel>
          <input className={inputBase} value={packaging} onChange={(e) => setPackaging(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Production date</FieldLabel>
          <input type="date" className={inputBase} value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Expiry / shelf-life date</FieldLabel>
          <input type="date" className={inputBase} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard step={3} title="Sample Details">
        <div>
          <FieldLabel>Date sample received</FieldLabel>
          <input type="date" className={inputBase} value={sampleReceivedDate} onChange={(e) => setSampleReceivedDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Collected by</FieldLabel>
          <input className={inputBase} value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Collection location</FieldLabel>
          <input className={inputBase} placeholder="factory, port, market" value={collectionLocation} onChange={(e) => setCollectionLocation(e.target.value)} />
        </div>
        <p className="col-span-1 text-xs text-muted-foreground sm:col-span-2">
          Note: there is no dedicated sample table yet — these values are saved as JSON inside the decision record's remarks.
        </p>
      </SectionCard>

      <SectionCard step={4} title="Test Details">
        <div>
          <FieldLabel>Standard tested against</FieldLabel>
          <input className={inputBase} placeholder="e.g. MS 214: Packaged Water" value={standard} onChange={(e) => setStandard(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Test type</FieldLabel>
          <input className={inputBase} placeholder="microbiological, chemical, contaminant…" value={testType} onChange={(e) => setTestType(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Test method / equipment used</FieldLabel>
          <input className={inputBase} value={testMethod} onChange={(e) => setTestMethod(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Date testing completed</FieldLabel>
          <input type="date" className={inputBase} value={testCompletedDate} onChange={(e) => setTestCompletedDate(e.target.value)} />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <FieldLabel>Parameters tested</FieldLabel>
            <button
              type="button"
              onClick={addParameter}
              className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              Add parameter
            </button>
          </div>
          <div className="space-y-2">
            {parameters.map((row) => (
              <div key={row.id} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-5">
                <input className={inputBase} placeholder="Parameter (e.g. lead level)" value={row.name} onChange={(e) => updateParameter(row.id, "name", e.target.value)} />
                <input className={inputBase} placeholder="Result" value={row.result} onChange={(e) => updateParameter(row.id, "result", e.target.value)} />
                <input className={inputBase} placeholder="Unit" value={row.unit} onChange={(e) => updateParameter(row.id, "unit", e.target.value)} />
                <input className={inputBase} placeholder="Pass/fail threshold" value={row.threshold} onChange={(e) => updateParameter(row.id, "threshold", e.target.value)} />
                <button
                  type="button"
                  onClick={() => removeParameter(row.id)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Note: there is no dedicated test-results table yet — these values are saved as JSON inside the decision record's remarks.
          </p>
        </div>
      </SectionCard>

      <SectionCard step={5} title="Result & Decision">
        {/* Read-only officer field */}
        <div className="sm:col-span-2">
          <FieldLabel>Recording officer</FieldLabel>
          <input
            className={cn(inputBase, "bg-muted/50 text-muted-foreground")}
            value={loggedInName ? `${loggedInName} (${loggedInEmail})` : loggedInEmail || "Not logged in"}
            disabled
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <FieldLabel>Decision *</FieldLabel>
          <select
            className={cn(
              inputBase,
              decision === "Certified" && "border-primary text-primary",
              decision === "Rejected" && "border-destructive text-destructive"
            )}
            value={decision}
            onChange={(e) => setDecision(e.target.value as "" | "Certified" | "Rejected")}
          >
            <option value="">Select decision…</option>
            <option value="Certified">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {decision === "Rejected" && (
          <>
            <div className="col-span-1 sm:col-span-2">
              <FieldLabel>Reason for rejection (required)</FieldLabel>
              <textarea
                className={cn(inputBase, "min-h-[88px] resize-y")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              {!rejectionReason.trim() && (
                <p className="mt-1 text-xs text-destructive">A reason is required to record a rejection.</p>
              )}
            </div>
            <label className="col-span-1 flex items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={resubmittable}
                onChange={(e) => setResubmittable(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Resubmittable after correction
            </label>
          </>
        )}
      </SectionCard>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={recordDecision}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ClipboardList className="h-4 w-4" />
          {submitting ? "Saving…" : "Record decision"}
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