type Summary = {
  generatedAt: string;

  totalProjects: number;
  totalTickets: number;

  slasOpen: number;
  slasOverdue: number;

  answeredOnTime: number;
  answeredLate: number;

  closedManual: number;
  noResponseNeeded: number;

  totalHandled: number;

  responseCount: number;
  avgResponseTimeMinutes: number;
};

type CardTone =
  | "default"
  | "info"
  | "warning"
  | "danger"
  | "success"
  | "late"
  | "manual"
  | "neutral"
  | "highlight";

type CardProps = {
  title: string;
  value: string | number;
  hint: string;
  tone?: CardTone;
};

function SummaryCard({
  title,
  value,
  hint,
  tone = "default",
}: CardProps) {
  const toneMap: Record<CardTone, string> = {
    default:
      "border-slate-700 bg-slate-900 text-slate-100",

    info:
      "border-sky-800 bg-sky-950/40 text-sky-100",

    warning:
      "border-amber-700 bg-amber-950/30 text-amber-100",

    danger:
      "border-rose-700 bg-rose-950/30 text-rose-100",

    success:
      "border-emerald-700 bg-emerald-950/30 text-emerald-100",

    late:
      "border-orange-700 bg-orange-950/30 text-orange-100",

    manual:
      "border-violet-700 bg-violet-950/30 text-violet-100",

    neutral:
      "border-slate-700 bg-slate-950 text-slate-100",

    highlight:
      "border-cyan-700 bg-cyan-950/30 text-cyan-100",
  };

  return (
    <div
      className={`flex min-h-[165px] flex-col justify-between rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${toneMap[tone]}`}
    >
      <div>
        <p className="text-sm font-semibold opacity-80">
          {title}
        </p>

        <p className="mt-3 text-3xl font-bold tracking-tight">
          {value}
        </p>
      </div>

      <p className="mt-4 text-sm leading-5 opacity-70">
        {hint}
      </p>
    </div>
  );
}

function formatAverage(
  value: number,
  responseCount: number
) {
  if (
    responseCount <= 0 ||
    !Number.isFinite(value)
  ) {
    return "Sem dados";
  }

  return `${Number(value.toFixed(2))} min`;
}

export function SummaryCards({
  summary,
}: {
  summary: Summary;
}) {
  const averageValue = formatAverage(
    summary.avgResponseTimeMinutes,
    summary.responseCount
  );

  const averageHint =
    summary.responseCount > 0
      ? `Calculada com ${summary.responseCount} ${
          summary.responseCount === 1
            ? "resposta válida"
            : "respostas válidas"
        }`
      : "Nenhuma resposta do CS registrada para cálculo";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      <SummaryCard
        title="Projetos ativos"
        value={summary.totalProjects}
        hint="Grupos configurados e monitorados"
        tone="default"
      />

      <SummaryCard
        title="Total de tickets"
        value={summary.totalTickets}
        hint="Todos os tickets gerados no período"
        tone="info"
      />

      <SummaryCard
        title="SLAs abertos"
        value={summary.slasOpen}
        hint="Clientes aguardando tratamento dentro do prazo"
        tone="warning"
      />

      <SummaryCard
        title="SLAs atrasados"
        value={summary.slasOverdue}
        hint="Clientes aguardando tratamento após o prazo"
        tone="danger"
      />

      <SummaryCard
        title="Respondidos no prazo"
        value={summary.answeredOnTime}
        hint="Respostas do CS enviadas antes do deadline"
        tone="success"
      />

      <SummaryCard
        title="Respondidos com atraso"
        value={summary.answeredLate}
        hint="Respostas do CS enviadas após o deadline"
        tone="late"
      />

      <SummaryCard
        title="Encerrados manualmente"
        value={summary.closedManual}
        hint="Tickets finalizados pelo responsável"
        tone="manual"
      />

      <SummaryCard
        title="Sem resposta necessária"
        value={summary.noResponseNeeded}
        hint="Mensagens analisadas que não exigiam retorno"
        tone="neutral"
      />

      <SummaryCard
        title="Total tratado"
        value={summary.totalHandled}
        hint="Respondidos, encerrados ou classificados pelo CS"
        tone="highlight"
      />

      <SummaryCard
        title="Média de resposta"
        value={averageValue}
        hint={averageHint}
        tone="success"
      />
    </div>
  );
}
