import { AnalysisDetailView } from "@/components/AnalysisDetail";
import { fetchAnalysis } from "@/lib/api";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function AnalysisPage({ params }: Props) {
  try {
    const analysis = await fetchAnalysis(params.id);
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <AnalysisDetailView analysis={analysis} />
      </main>
    );
  } catch {
    notFound();
  }
}
