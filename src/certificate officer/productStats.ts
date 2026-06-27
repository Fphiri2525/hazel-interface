// ── api/productStats.ts ──────────────────────────────────────────────────
// Small, focused API layer for the certificate-officer statistics dashboard.
// Reuses the existing GET /api/record-product list endpoint and derives
// the counts client-side, rather than relying on a dedicated stats route.

const API_BASE_URL = "http://localhost:5000";
export const RECORD_PRODUCT_URL = `${API_BASE_URL}/api/record-product`;

// ── Shape returned by GET /api/record-product ───────────────────────────
export interface ProductListItem {
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

export interface ProductListResponse {
  success: boolean;
  count: number;
  products: ProductListItem[];
}

export interface ProductStats {
  total: number;
  certified: number;
  rejected: number;
}

/**
 * Fetches every recorded product decision from the backend.
 * Throws on network failure or a non-success response so callers can
 * decide how to surface the error (e.g. set an error message in state).
 */
export async function fetchProducts(): Promise<ProductListItem[]> {
  const response = await fetch(RECORD_PRODUCT_URL, { method: "GET" });
  const data: ProductListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error((data as any)?.error || "Failed to load product records.");
  }

  return data.products || [];
}

/**
 * Derives dashboard statistics (total / certified / rejected) from the
 * full product list. Kept as a pure function so it's easy to unit test
 * and reuse anywhere counts are needed.
 */
export function computeProductStats(products: ProductListItem[]): ProductStats {
  let certified = 0;
  let rejected = 0;

  for (const p of products) {
    if (p.decision?.status === "APPROVED") certified += 1;
    else if (p.decision?.status === "REJECTED") rejected += 1;
  }

  return {
    total: products.length,
    certified,
    rejected,
  };
}

/**
 * Convenience wrapper: fetch the product list and return both the raw
 * list and the derived stats in one call.
 */
export async function fetchProductStats(): Promise<{
  products: ProductListItem[];
  stats: ProductStats;
}> {
  const products = await fetchProducts();
  return { products, stats: computeProductStats(products) };
}