// src/inspector/VerifyProduct.tsx
import * as React from "react";
import {
  CheckCircle,
  AlertTriangle,
  Package,
  Building2,
  MapPin,
  Calendar,
  Hash,
  FileText,
  ShoppingBag,
  Scan,
  RotateCcw,
  Info,
  Download,
  Share2,
  Printer,
  Search,
  Loader2,
  User,
  Phone,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:5000";

// Types
interface ProductVerification {
  id: string;
  productName: string;
  category: string;
  batchNumber: string;
  expiryDate: string | null;
  status: "certified" | "expired" | "unknown"; // Added "unknown" as a valid status
  manufacturerName: string;
  delivery: {
    quantity: number | null;
    unitPrice: number | null;
    transactionDate: string | null;
    deliveryDate: string | null;
    invoiceReference: string | null;
    notes: string | null;
  };
  buyer: {
    companyName: string | null;
    registrationNumber: string | null;
    contactPerson: string | null;
    phone: string | null;
    destinationAddress: string | null;
  };
  recordedBy?: string;
  createdAt?: string;
}

// Shape returned by GET /api/verify/:code
interface VerifyApiResult {
  id: string;
  status: ProductVerification["status"];
  productName: string;
  category: string;
  batchNumber: string;
  expiryDate: string | null;
  manufacturer: {
    name: string;
  };
  delivery: {
    quantity: number | null;
    unitPrice: number | null;
    transactionDate: string | null;
    deliveryDate: string | null;
    invoiceReference: string | null;
    notes: string | null;
  };
  buyer: {
    companyName: string | null;
    registrationNumber: string | null;
    contactPerson: string | null;
    phone: string | null;
    destinationAddress: string | null;
  };
  recordedBy: string | null;
  createdAt: string | null;
}

// Maps the API response shape onto the shape this component renders
function mapApiResultToProduct(r: VerifyApiResult): ProductVerification {
  return {
    id: r.id,
    productName: r.productName,
    category: r.category,
    batchNumber: r.batchNumber,
    expiryDate: r.expiryDate,
    status: r.status || "unknown", // Fallback to "unknown" if status is missing
    manufacturerName: r.manufacturer?.name || "Unknown Manufacturer",
    delivery: r.delivery || {
      quantity: null,
      unitPrice: null,
      transactionDate: null,
      deliveryDate: null,
      invoiceReference: null,
      notes: null,
    },
    buyer: r.buyer || {
      companyName: null,
      registrationNumber: null,
      contactPerson: null,
      phone: null,
      destinationAddress: null,
    },
    recordedBy: r.recordedBy || undefined,
    createdAt: r.createdAt || undefined,
  };
}

// Status Configuration - Added "unknown" status
const STATUS_CONFIG = {
  certified: {
    label: "Valid",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    borderColor: "border-green-500/30",
    description: "Batch found and within its expiry window",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    borderColor: "border-orange-500/30",
    description: "This batch has passed its expiry date",
  },
  unknown: {
    label: "Unknown",
    icon: AlertTriangle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
    borderColor: "border-gray-500/30",
    description: "Status information is unavailable",
  },
};

// Sub-components - Updated with fallback
const StatusBadge: React.FC<{ status: ProductVerification["status"] }> = ({ status }) => {
  // Use the status if it exists and is valid, otherwise use "unknown"
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
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

// Updated StatusDetails with fallback
const StatusDetails: React.FC<{ status: ProductVerification["status"] }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
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

const formatMoney = (v: number | null) =>
  v === null || v === undefined ? "N/A" : `MWK ${Number(v).toLocaleString()}`;

// Main Component
export default function VerifyProduct() {
  const [scanned, setScanned] = React.useState(false);
  const [product, setProduct] = React.useState<ProductVerification | null>(null);
  const [productCode, setProductCode] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Calls GET /api/verify/:code with the batch number that was typed in.
  const verifyCode = React.useCallback(async (code: string) => {
    setError(null);
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/verify/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Batch not found. Please check the number and try again.");
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
      setError("Please enter a product batch number");
      return;
    }
    verifyCode(productCode.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
          Enter the product batch number to retrieve product, expiry, and manufacturer details
        </p>
      </div>

      {/* Verification Section */}
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
          <div className="space-y-1.5">
            {/* Manual Entry - Batch Number */}
            <label className="text-xs font-medium text-foreground">
              Enter Product Batch Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. bbboooo7ty"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  disabled={isSearching}
                  autoFocus
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
              Enter the batch number printed on the product label or delivery invoice
            </p>
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
                    {product?.productName || "Unknown Product"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product?.manufacturerName || "Unknown Manufacturer"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={product?.status || "unknown"} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {product?.id || "N/A"}
                </span>
              </div>
            </div>

            <StatusDetails status={product?.status || "unknown"} />

            {/* Product Details */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Product Details</h4>
              <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="space-y-0 sm:pr-3">
                  <DetailRow
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    label="Manufacturer / Supplier"
                    value={product?.manufacturerName || "N/A"}
                  />
                  <DetailRow
                    icon={<ShoppingBag className="h-3.5 w-3.5" />}
                    label="Category"
                    value={product?.category || "N/A"}
                  />
                  <DetailRow
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Batch Number"
                    value={product?.batchNumber || "N/A"}
                  />
                </div>
                <div className="space-y-0 sm:pl-3">
                  <DetailRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Expiry Date"
                    value={product?.expiryDate || "N/A"}
                  />
                  <DetailRow
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Invoice Reference"
                    value={product?.delivery?.invoiceReference || "N/A"}
                  />
                  <DetailRow
                    icon={<Truck className="h-3.5 w-3.5" />}
                    label="Delivery Date"
                    value={product?.delivery?.deliveryDate || "N/A"}
                  />
                </div>
              </div>
            </div>

            {/* Expiry & Delivery Info */}
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
                  Quantity / Unit Price
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {product?.delivery?.quantity ?? "N/A"} units
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatMoney(product?.delivery?.unitPrice ?? null)} per unit
                </p>
              </div>
            </div>

            {/* Buyer / Destination Details */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Buyer / Destination</h4>
              <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="space-y-0 sm:pr-3">
                  <DetailRow
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    label="Buyer Company"
                    value={product?.buyer?.companyName || "N/A"}
                  />
                  <DetailRow
                    icon={<User className="h-3.5 w-3.5" />}
                    label="Contact Person"
                    value={product?.buyer?.contactPerson || "N/A"}
                  />
                </div>
                <div className="space-y-0 sm:pl-3">
                  <DetailRow
                    icon={<Phone className="h-3.5 w-3.5" />}
                    label="Contact Phone"
                    value={product?.buyer?.phone || "N/A"}
                  />
                  <DetailRow
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Destination Address"
                    value={product?.buyer?.destinationAddress || "N/A"}
                  />
                </div>
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
    </div>
  );
}