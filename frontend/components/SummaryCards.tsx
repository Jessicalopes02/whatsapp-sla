type Summary = {
  generatedAt: string;
  totalProjects: number;
  slasOpen: number;
  slasOverdue: number;
  avgResponseTimeMinutes: number;
};

type CardProps = {
  title: string;
  value: string | number;
  hint: string;
  tone?: "default" | "warning" | "danger" | "success";
};

function SummaryCard({ title, value, hint, tone = "default" }: CardProps) {
  const toneMap = {
    default: "border-slate-200 bg-slate text-slate-100",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${toneMap[tone]}`}
    >
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm opacity-70">{hint}</p>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Projetos ativos"
        value={summary.totalProjects}
        hint="Projetos monitorados no momento"
        tone="default"
      />

      <SummaryCard
        title="SLAs abertos"
        value={summary.slasOpen}
        hint="Tickets aguardando resposta"
        tone="warning"
      />

      <SummaryCard
        title="SLAs atrasados"
        value={summary.slasOverdue}
        hint="Tickets com prazo vencido"
        tone="danger"
      />

      <SummaryCard
        title="Média de resposta"
        value={`${summary.avgResponseTimeMinutes} min`}
        hint="Tempo médio da primeira resposta"
        tone="success"
      />
    </div>
  );
}