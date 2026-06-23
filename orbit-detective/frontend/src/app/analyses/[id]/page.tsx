import { AnalysisDetailClient } from "@/components/AnalysisDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default function AnalysisPage({ params }: Props) {
  return <AnalysisDetailClient id={params.id} />;
}
