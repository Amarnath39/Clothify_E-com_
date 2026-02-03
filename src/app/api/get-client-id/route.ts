// app/api/config/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ keyId: process.env.RAZORPAY_KEY_ID });
}