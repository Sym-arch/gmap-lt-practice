import { getServiceClient } from "@/lib/supabaseServer";

/* Stripe Checkoutセッションから購入記録を保存（重複はstripe_session_idで防止） */
export async function grantPurchase(session) {
  const userId =
    (session.metadata && session.metadata.user_id) || session.client_reference_id;
  if (!userId) return false;
  const svc = getServiceClient();
  if (!svc) return false;
  const { error } = await svc.from("purchases").upsert(
    {
      user_id: userId,
      product: "all_access",
      stripe_session_id: session.id,
    },
    { onConflict: "stripe_session_id" }
  );
  return !error;
}
