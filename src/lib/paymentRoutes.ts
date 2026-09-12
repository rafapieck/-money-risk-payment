import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RiskLevel, PaymentRouteType } from "@/lib/supabase/types";

const preferredTypesByRisk: Record<RiskLevel, PaymentRouteType[]> = {
  high: ["imss_route", "installment_plan"],
  moderate: ["installment_plan", "community_fund"],
  low: ["community_fund", "installment_plan"],
};

type PaymentRouteRow = Database["public"]["Tables"]["payment_routes"]["Row"];

// Simple matching: prefer routes whose type fits the risk level, fall back
// to any active route so the results screen always has something to show
// (or falls back gracefully) even if the preferred types aren't seeded yet.
export async function selectPaymentRoutes(
  supabase: SupabaseClient<Database>,
  riskLevel: RiskLevel
): Promise<PaymentRouteRow[]> {
  const preferredTypes = preferredTypesByRisk[riskLevel];

  const { data: preferred } = await supabase
    .from("payment_routes")
    .select("*")
    .eq("is_active", true)
    .in("type", preferredTypes)
    .limit(2);

  if (preferred && preferred.length > 0) {
    return preferred
      .slice()
      .sort(
        (a, b) =>
          preferredTypes.indexOf(a.type) - preferredTypes.indexOf(b.type)
      )
      .slice(0, 2);
  }

  const { data: fallback } = await supabase
    .from("payment_routes")
    .select("*")
    .eq("is_active", true)
    .limit(2);

  return fallback ?? [];
}
