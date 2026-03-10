import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user needs onboarding (no orgs yet)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Accept any pending invitations for this email
        const { data: pendingInvites } = await supabase
          .from("org_invitations")
          .select("id, organization_id, role")
          .eq("email", user.email!)
          .eq("status", "pending");

        if (pendingInvites && pendingInvites.length > 0) {
          for (const invite of pendingInvites) {
            // Add user to org
            await supabase.from("org_members").upsert({
              organization_id: invite.organization_id,
              user_id: user.id,
              role: invite.role,
            }, { onConflict: "organization_id,user_id" });

            // Mark invitation as accepted
            await supabase
              .from("org_invitations")
              .update({ status: "accepted" })
              .eq("id", invite.id);
          }
        }

        const { data: existingOrgs } = await supabase
          .from("organizations")
          .select("id")
          .limit(1);

        if (!existingOrgs || existingOrgs.length === 0) {
          // Create org from signup metadata
          const orgName =
            (user.user_metadata?.org_name as string) || "Minha Organização";
          const orgSlug =
            (user.user_metadata?.org_slug as string) ||
            orgName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

          const { data: orgRaw } = await supabase
            .from("organizations")
            .insert({ name: orgName, slug: orgSlug })
            .select()
            .single();

          if (orgRaw) {
            const org = orgRaw as { id: string };

            // Add user as owner
            await supabase.from("org_members").insert({
              organization_id: org.id,
              user_id: user.id,
              role: "owner",
            });

            // Create default cash accounts
            await supabase.from("cash_accounts").insert([
              {
                organization_id: org.id,
                name: "Meu Caixa",
                type: "personal" as const,
              },
              {
                organization_id: org.id,
                name: "Caixa da Empresa",
                type: "company" as const,
              },
              {
                organization_id: org.id,
                name: "Caixa 2",
                type: "cash2" as const,
              },
            ]);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
