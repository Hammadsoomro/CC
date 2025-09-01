export type PlanKey = "free" | "starter" | "professional" | "enterprise";

export const PLAN_LIMITS: Record<PlanKey, { maxSubs: number }> = {
  free: { maxSubs: 0 },
  starter: { maxSubs: 1 },
  professional: { maxSubs: 3 },
  enterprise: { maxSubs: 5 },
};

export function getMaxSubsForPlan(plan?: string | null) {
  const key = (plan || "free").toLowerCase() as PlanKey;
  return PLAN_LIMITS[key as PlanKey]?.maxSubs ?? 0;
}
