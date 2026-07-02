// ── api/distributionStats.ts ─────────────────────────────────────────────
// Small, focused API layer for the distribution/sales statistics dashboard.
// Reuses the existing GET /api/record-distribution list endpoint and
// derives the counts client-side, rather than relying on a dedicated
// stats route — same pattern as api/productStats.ts.

const API_BASE_URL = "http://localhost:5000";
export const RECORD_DISTRIBUTION_URL = `${API_BASE_URL}/api/summary`;

// ── Shape returned by GET /api/record-distribution ──────────────────────
export interface DistributionListItem {
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
  companyName: string | null;
  createdAt: string;
}

export interface DistributionListResponse {
  success: boolean;
  count: number;
  distributions: DistributionListItem[];
}

export interface DistributionStats {
  totalRecords: number;
  totalQuantity: number;
  expiringSoon: number;
}

/**
 * Fetches every recorded distribution/sale from the backend.
 * Throws on network failure or a non-success response so callers can
 * decide how to surface the error (e.g. set an error message in state).
 */
export async function fetchDistributions(): Promise<DistributionListItem[]> {
  const response = await fetch(RECORD_DISTRIBUTION_URL, { method: "GET" });
  const data: DistributionListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error((data as any)?.error || "Failed to load distribution records.");
  }

  return data.distributions || [];
}

/**
 * Derives dashboard statistics (total records / total quantity / expiring
 * soon) from a distribution list. Kept as a pure function so it's easy to
 * unit test and reuse anywhere counts are needed.
 *
 * "Expiring soon" = batches whose expiry_date falls within the next 30
 * days from today (inclusive), matching a common shelf-life alert window.
 */
export function computeDistributionStats(
  distributions: DistributionListItem[]
): DistributionStats {
  let totalQuantity = 0;
  let expiringSoon = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 30);

  for (const d of distributions) {
    totalQuantity += Number(d.quantity) || 0;

    if (d.expiryDate) {
      const expiry = new Date(d.expiryDate);
      if (!isNaN(expiry.getTime()) && expiry >= today && expiry <= cutoff) {
        expiringSoon += 1;
      }
    }
  }

  return {
    totalRecords: distributions.length,
    totalQuantity,
    expiringSoon,
  };
}

/**
 * Convenience wrapper: fetch the distribution list and return both the raw
 * list and the derived stats in one call.
 *
 * @param companyName Optional — when provided, scopes both the returned
 * list and the stats to just this company (matching the client-side
 * scoping already used in RecordDistribution.tsx), since the underlying
 * route isn't scoped by company itself.
 */
export async function fetchDistributionStats(companyName?: string): Promise<{
  distributions: DistributionListItem[];
  stats: DistributionStats;
}> {
  const all = await fetchDistributions();
  const scoped = companyName ? all.filter((d) => d.companyName === companyName) : all;
  return { distributions: scoped, stats: computeDistributionStats(scoped) };
}