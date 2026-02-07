import { NextResponse } from "next/server";
import { ALL_PERMISSIONS, PERMISSION_MODULES } from "@/lib/permissions";

export async function GET() {
  return NextResponse.json({ permissions: ALL_PERMISSIONS, modules: PERMISSION_MODULES });
}
