// src/inspector/VerifyProduct.tsx
import * as React from "react";
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Package,
  Building2,
  MapPin,
  Calendar,
  Hash,
  FileText,
  ShoppingBag,
  Scan,
  RotateCcw,
  AlertOctagon,
  Info,
  Download,
  Share2,
  Printer,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Html5Qrcode } from "html5-qrcode";

const API_BASE_URL = "http://localhost:5000";

// Types
interface ProductVerification {
  id: string;
  productName: string;
  brandName?: string;
  manufacturerName: string;
  countryOfOrigin?: string;
  category: string;
  batchNumber: string;
  certificateNumber: string;
  approvalDate?: string;
  expiryDate: string | null;
  imageUrl?: string;
  status: "certified" | "rejected" | "expired" | "suspended" | "unregistered";
  lastInspectionDate?: string;
  certificationBody?: string;
}

// Shape returned by GET /api/verify/:code
interface VerifyApiResult {
  id: string;
  status: ProductVerification["status"];
  productName: string;
  category: string;
  productType: string;
  manufacturer: {
    id: number;
    name: string;
    registrationNumber: string | null;
    address: string | null;
    contactNumber: string | null;
    facilityLocation: string | null;
  };
  batch: {
    id: number;
    batchNumber: string;
    quantity: number | null;
    productionDate: string | null;
    expiryDate: string | null;
    packagingType: string | null;
  };
  certificate: {
    certificateNumber: string;
    barcodeValue: string;
    qrCodeValue: string;
    issueDate: string;
    expiryDate: string | null;
    status: string;
  };
  decision: {
    status: string;
    date: string;
    remarks: Record<string, unknown>;
  } | null;
}

// Maps the API response shape onto the shape this component renders
function mapApiResultToProduct(r: VerifyApiResult): ProductVerification {
  return {
    id: r.id,
    productName: r.productName,
    manufacturerName: r.manufacturer.name,
    countryOfOrigin: r.manufacturer.facilityLocation || undefined,
    category: r.category,
    batchNumber: r.batch.batchNumber,
    certificateNumber: r.certificate.certificateNumber,
    approvalDate: r.certificate.issueDate,
    expiryDate: r.certificate.expiryDate,
    status: r.status,
    lastInspectionDate: r.decision?.date,
    certificationBody: "Malawi Bureau of Standards",
  };
}

// Status Configuration
const STATUS_CONFIG = {
  certified: {
    label: "Certified",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    borderColor: "border-green-500/30",
    description: "Product meets all MBS standards",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:bg-red-500/20",
    borderColor: "border-red-500/30",
    description: "Product does not meet MBS standards",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    borderColor: "border-orange-500/30",
    description: "Product certification has expired",
  },
  suspended: {
    label: "Suspended",
    icon: AlertOctagon,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    description: "Product certification temporarily suspended",
  },
  unregistered: {
    label: "Unregistered",
    icon: MinusCircle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
    borderColor: "border-gray-500/30",
    description: "Product not registered with MBS",
  },
};

// Sub-components
const StatusBadge: React.FC<{ status: ProductVerification["status"] }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
      config.bgColor,
      config.borderColor,
      config.color
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold">{config.label}</span>
    </div>
  );
};

const StatusDetails: React.FC<{ status: ProductVerification["status"] }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <div className={cn(
      "mt-2 rounded-lg border p-2.5",
      config.bgColor,
      config.borderColor
    )}>
      <p className={cn("text-xs", config.color)}>
        {config.description}
      </p>
    </div>
  );
};

const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => {
  return (
    <div className="flex items-start gap-2 border-b border-border py-2 last:border-0">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "success" | "warning" | "danger" | "outline";
}> = ({ icon, label, onClick, variant = "primary" }) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    success: "bg-green-500 text-white hover:bg-green-600",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-border bg-background hover:bg-muted",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
        "hover:scale-105 active:scale-95",
        variants[variant]
      )}
    >
      {icon}
      {label}
    </button>
  );
};

// ---------------------------------------------------------------------------
// QR Scanner — opens the device camera and decodes QR codes in real time
// using html5-qrcode. Calls onDecoded(text) the first time a code is read,
// then stops itself.
// ---------------------------------------------------------------------------
const QR_REGION_ID = "verify-qr-scanner-region";

const QrScannerModal: React.FC<{
  onDecoded: (text: string) => void;
  onClose: () => void;
}> = ({ onDecoded, onClose }) => {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const hasDecodedRef = React.useRef(false);

  React.useEffect(() => {
    const scanner = new Html5Qrcode(QR_REGION_ID);
    scannerRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (hasDecodedRef.current || cancelled) return;
          hasDecodedRef.current = true;
          onDecoded(decodedText);
        },
        () => {
          // per-frame "no QR found yet" callback — intentionally ignored
        }
      )
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            err?.message?.includes("Permission")
              ? "Camera access was denied. Please allow camera permissions and try again."
              : "Could not start the camera on this device."
          );
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {
            // scanner was already stopped/never started — safe to ignore
          });
      }
    };
  }, [onDecoded]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Scan Product QR Code</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {cameraError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            {cameraError}
          </div>
        ) : (
          <div
            id={QR_REGION_ID}
            className="overflow-hidden rounded-lg bg-black"
            style={{ minHeight: 260 }}
          />
        )}

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Point the camera at the product's QR code
        </p>
      </div>
    </div>
  );
};

// Main Component
export default function VerifyProduct() {
  const [showScanner, setShowScanner] = React.useState(false);
  const [scanned, setScanned] = React.useState(false);
  const [product, setProduct] = React.useState<ProductVerification | null>(null);
  const [productCode, setProductCode] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Shared lookup: calls GET /api/verify/:code with whatever code we have,
  // whether it came from typing or from a decoded QR scan.
  const verifyCode = React.useCallback(async (code: string) => {
    setError(null);
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/verify/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Product not found. Please check the code and try again.");
        setProduct(null);
        setScanned(false);
        return;
      }

      setProduct(mapApiResultToProduct(data.result));
      setScanned(true);
    } catch (err) {
      setError("Could not reach the server. Please check your connection and try again.");
      setProduct(null);
      setScanned(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = () => {
    if (!productCode.trim()) {
      setError("Please enter a certificate number");
      return;
    }
    verifyCode(productCode.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleQrDecoded = (text: string) => {
    setShowScanner(false);
    setProductCode(text);
    verifyCode(text);
  };

  const handleReset = () => {
    setProduct(null);
    setScanned(false);
    setProductCode("");
    setError(null);
  };

  const handleScanAnother = () => {
    handleReset();
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Verify Product</h1>
        <p className="text-xs text-muted-foreground">
          Scan a QR code or enter the certificate number to verify certification status
        </p>
      </div>

      {/* Scanner Section */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Product Verification</h2>
          </div>
          {scanned && (
            <button
              onClick={handleScanAnother}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Verify Another
            </button>
          )}
        </div>

        {!scanned ? (
          <div className="space-y-4">
            {/* Scanner Button */}
            <button
              onClick={() => setShowScanner(true)}
              className={cn(
                "relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 py-6 transition-all",
                "hover:border-primary hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
                <div className="relative rounded-full bg-primary/10 p-3 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">Tap to Scan</p>
              <p className="text-xs text-muted-foreground">Scan the product's QR code</p>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-[10px] text-muted-foreground">OR</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Manual Entry - Certificate Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Enter Certificate Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g. MBS-A1B2C3D4"
                    className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!productCode.trim() || isSearching}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all",
                    "hover:bg-primary/90 hover:scale-105",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                  Verify
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Enter the certificate number printed on the product label
              </p>
            </div>
          </div>
        ) : (
          // Verification Result
          <div className="space-y-4">
            {/* Product Status Header */}
            <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {product?.productName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product?.manufacturerName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={product?.status || "unregistered"} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {product?.id}
                </span>
              </div>
            </div>

            <StatusDetails status={product?.status || "unregistered"} />

            {/* Product Details */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Product Details</h4>
              <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="space-y-0 sm:pr-3">
                  <DetailRow
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    label="Manufacturer"
                    value={product?.manufacturerName || "N/A"}
                  />
                  <DetailRow
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Facility Location"
                    value={product?.countryOfOrigin || "N/A"}
                  />
                  <DetailRow
                    icon={<ShoppingBag className="h-3.5 w-3.5" />}
                    label="Category"
                    value={product?.category || "N/A"}
                  />
                </div>
                <div className="space-y-0 sm:pl-3">
                  <DetailRow
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Batch Number"
                    value={product?.batchNumber || "N/A"}
                  />
                  <DetailRow
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Certificate Number"
                    value={product?.certificateNumber || "N/A"}
                  />
                  <DetailRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Issue Date"
                    value={product?.approvalDate || "N/A"}
                  />
                </div>
              </div>
            </div>

            {/* Expiry & Certification Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Expiry Date
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {product?.expiryDate || "N/A"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {product?.expiryDate ? (
                    new Date(product.expiryDate) > new Date() ? (
                      <span className="text-green-500">✓ Valid</span>
                    ) : (
                      <span className="text-red-500">✗ Expired</span>
                    )
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Certification Body
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {product?.certificationBody || "N/A"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Last Decision: {product?.lastInspectionDate || "N/A"}
                </p>
              </div>
            </div>

            {/* Inspector Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">Inspector Actions</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <ActionButton
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  label="Report Violation"
                  onClick={() => console.log("Report Violation")}
                  variant="danger"
                />
                <ActionButton
                  icon={<Scan className="h-3.5 w-3.5" />}
                  label="Verify Another"
                  onClick={handleScanAnother}
                  variant="outline"
                />
              </div>
            </div>

            {/* Additional Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                  <Download className="h-3 w-3" />
                  Download
                </button>
                <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                  <Printer className="h-3 w-3" />
                  Print
                </button>
              </div>
              <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                <Share2 className="h-3 w-3" />
                Share
              </button>
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <QrScannerModal
          onDecoded={handleQrDecoded}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}