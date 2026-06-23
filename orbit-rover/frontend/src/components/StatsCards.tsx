import type { Stats } from "@/lib/api";
import { formatConfidence } from "@/lib/api";

interface Props {
  stats: Stats;
}

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "Analyses Run", value: stats.total.toString(), icon: "📊" },
    { label: "Avg Time Saved", value: stats.avg_time_saved || "—", icon: "⏱️" },
    { label: "Most Common Failure", value: stats.most_common_failure?.slice(0, 40) || "—", icon: "🔥", small: true },
    { label: "Avg Confidence", value: stats.total ? formatConfidence(stats.avg_confidence) : "—", icon: "🎯" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card-glow rounded-xl bg-slate-900/60 p-5">
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className={`font-bold text-slate-100 ${card.small ? "text-sm leading-snug" : "text-2xl"}`}>
            {card.value}
          </div>
          <div className="text-sm text-slate-400 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
