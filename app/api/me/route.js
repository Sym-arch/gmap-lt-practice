import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, premium } = await getAccess();
  return NextResponse.json({
    loggedIn: !!user,
    email: user ? user.email : null,
    premium,
    authConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });
}
