import { NextResponse } from "next/server";
import {
  countCampaignSubscriptions,
  CAMPAIGN_FREE_LIMIT,
  CAMPAIGN_TRIAL_DAYS,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/* 先着◯名・初月無料キャンペーンの受付状況を返す（バナー表示用） */
export async function GET() {
  const used = await countCampaignSubscriptions();
  if (used === null) {
    return NextResponse.json({ active: false });
  }
  const remaining = Math.max(0, CAMPAIGN_FREE_LIMIT - used);
  return NextResponse.json({
    active: remaining > 0,
    remaining,
    limit: CAMPAIGN_FREE_LIMIT,
    trialDays: CAMPAIGN_TRIAL_DAYS,
  });
}
