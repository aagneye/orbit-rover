import type { Stats } from "@/lib/api";
import { formatConfidence } from "@/lib/api";

interface Props {
  stats: Stats;
}

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "Analyses run", value: stats.total.toString(), accent: "bg-orbit-50 text-orbit-700" },
    { label: "Avg time saved", value: stats.avg_time_saved || "—", accent: "bg-emerald-50 text-emerald-700" },
    {
      label: "Top failure",
      value: stats.most_common_failure?.slice(0, 36) || "—",
      accent: "bg-orange-50 text-orange-700",
      small: true,
    },
    {
      label: "Avg confidence",
      value: stats.total ? formatConfidence(stats.avg_confidence) : "—",
      accent: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card-surface p-5">
          <div className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${card.accent}`}>
            {card.label}
          </div>
          <div
            className={`font-semibold text-stone-900 ${card.small ? "text-sm leading-snug" : "text-2xl tabular-nums"}`}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
