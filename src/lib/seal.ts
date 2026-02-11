/**
 * Seal integration module for gated content access control.
 *
 * Current approach: Hybrid — server checks donation threshold via Supabase,
 * content stored on Walrus. When Seal SDK matures with off-chain policy support,
 * this module can be upgraded to use Seal's identity-based encryption.
 *
 * Future: Use @mysten/seal for on-chain access policy enforcement.
 */

export interface GatedContentMeta {
  id: string;
  streamer_id: string;
  title: string;
  description: string | null;
  min_donation_usdc: number;
  content_type: string;
  created_at: string;
}

export interface GatedContentWithAccess extends GatedContentMeta {
  has_access: boolean;
  total_donated: number;
}

// Placeholder for future Seal integration
export function isSealAvailable(): boolean {
  // Will return true once Seal SDK supports off-chain policy without custom Move module
  return false;
}
