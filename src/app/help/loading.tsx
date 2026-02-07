"use client";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
export default function Loading() {
  return (<div role="status" aria-label="Carregando conteúdo"><span className="sr-only">Carregando...</span><DashboardSkeleton /></div>);
}
