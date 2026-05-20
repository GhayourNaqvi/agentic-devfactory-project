import type { Metadata } from "next";
import { PsxDashboard } from "@/hooks/usePsxStocks";

export const metadata: Metadata = {
  title: "PSX Dashboard — Pakistan Stock Exchange",
  description: "View top 100 Pakistan Stock Exchange stocks with real-time data, sorting, and filtering.",
};

export default function PsxPage() {
  return <PsxDashboard />;
}
