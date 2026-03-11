import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time setup endpoint to create the admin test user.
 *
 * Usage:
 *   GET /api/setup?key=YOUR_SUPABASE_SERVICE_ROLE_KEY
 *
 * The service_role key can be found at:
 *   https://supabase.com/dashboard/project/_/settings/api
 *   (section "Project API keys" → "service_role")
 */
export async function GET(req: NextRequest) {
  const serviceRoleKey =
    req.nextUrl.searchParams.get("key") ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Missing service_role key. Pass it as ?key=YOUR_SERVICE_ROLE_KEY or set SUPABASE_SERVICE_ROLE_KEY env var.",
        hint: "Get it from: https://supabase.com/dashboard/project/pskvfegwnqdfbstqkpob/settings/api",
      },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const TEST_EMAIL = "admin@admin.com.br";
  const TEST_PASSWORD = "12345678";

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === TEST_EMAIL
  );

  if (existingUser) {
    // Update password and ensure confirmed
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: TEST_PASSWORD,
        email_confirm: true,
      }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: "updated",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      message: "Usuário existente atualizado e confirmado. Pode fazer login agora!",
      login_url: `${req.nextUrl.origin}/login`,
    });
  }

  // Create new user with email confirmed
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { org_name: "Admin", org_slug: "admin" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    action: "created",
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    user_id: data.user?.id,
    message: "Usuário admin criado com email já confirmado. Pode fazer login agora!",
    login_url: `${req.nextUrl.origin}/login`,
  });
}
