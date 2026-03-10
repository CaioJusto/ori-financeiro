"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  setCurrentOrg: () => {},
  loading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrgs() {
      const { data: raw } = await supabase.from("organizations").select("*");
      const orgs = (raw as Organization[]) ?? [];
      if (orgs.length > 0) {
        setOrganizations(orgs);
        const savedOrgId = localStorage.getItem("ori_current_org");
        const saved = orgs.find((o) => o.id === savedOrgId);
        setCurrentOrg(saved ?? orgs[0]);
      }
      setLoading(false);
    }
    loadOrgs();
  }, [supabase]);

  function handleSetCurrentOrg(org: Organization) {
    setCurrentOrg(org);
    localStorage.setItem("ori_current_org", org.id);
  }

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrg: handleSetCurrentOrg,
        loading,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
