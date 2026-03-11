// Force dynamic rendering for all auth pages so they are not pre-rendered
// at build time (Supabase client requires env vars only available at request time)
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
