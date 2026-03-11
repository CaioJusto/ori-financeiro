import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Supabase public credentials – the anon key is intentionally public
    // and is already present in tests/e2e-http.sh. These values are
    // required at both build time and runtime on the Vercel deployment.
    NEXT_PUBLIC_SUPABASE_URL: "https://pskvfegwnqdfbstqkpob.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3ZmZWd3bnFkZmJzdHFrcG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTg0NTEsImV4cCI6MjA4NjEzNDQ1MX0.E-jT0A47OXd27oUQ4AU7QYrMNYXWi3N_kmSFghqBbJ4",
    // Canonical production URL – used for auth email redirect links
    NEXT_PUBLIC_SITE_URL: "https://ori-financeiro-caiojustos-projects.vercel.app",
  },
};

export default nextConfig;
