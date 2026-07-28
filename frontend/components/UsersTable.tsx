import type { ReactNode } from "react";

type UserRow = {
  userId: string;
  name: string;
  phone: string;

  sectorId?: string | null;
  sectorName?: string | null;

  projectsCount: number;
  totalTickets: number;

  openTickets: number;
  overdueTickets: number;

  answeredOnTime: number;
  answeredLate: number;

  closedManual: number;
  noResponseNeeded: number;

  totalHandled: number;

  responseCount: number;
  avgResponseTimeMinutes: number;
};

type BadgeTone =
  | "default"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "manual"
  | "neutral"
  | "highlight";

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const toneMap: Record<BadgeTone, string> = {
    default:
      "border-slate-700 bg-slate-800 text-slate-200",

    danger:
      "border-rose-800 bg-rose-950/50 text-rose-300",

    warning:
      "border-amber-800 bg-amber-950/50 text-amber-300",

    success:
      "border-emerald-800 bg-emerald-950/50 text-emerald-300",

    info:
      "border-sky-800 bg-sky-950/50 text-sky-300",

    manual:
      "border-violet-800 bg-violet-950/50 text-violet-300",

    neutral:
      "border-slate-700 bg-slate-950 text-slate-300",

    highlight:
      "border-cyan-800 bg-cyan-950/50 text-cyan-300",
  };

  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}
    >
      {children}
    </span>
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

function calculateHandledPercentage(
  totalHandled: number,
  totalTickets: number
) {
  if (totalTickets <= 0) {
    return 0;
  }

  return Math.round(
    (totalHandled / totalTickets) * 100
  );
}

export function UsersTable({
  items,
}: {
  items: UserRow[];
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
        <p className="text-sm font-medium text-slate-300">
          Nenhum responsável encontrado.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Verifique os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-[1450px] w-full text-sm">
          <thead className="bg-slate-950">
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-4 font-semibold">
                Responsável
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Projetos
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Tickets
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Abertos
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Atrasados
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                No prazo
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Com atraso
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Encerrados
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Sem resposta
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Tratados
              </th>

              <th className="px-3 py-4 text-center font-semibold">
                Taxa tratada
              </th>

              <th className="px-4 py-4 text-right font-semibold">
                Média
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {items.map((item) => {
              const handledPercentage =
                calculateHandledPercentage(
                  item.totalHandled,
                  item.totalTickets
                );

              const averageLabel =
                formatAverage(
                  item.avgResponseTimeMinutes,
                  item.responseCount
                );

              return (
                <tr
                  key={item.userId}
                  className="transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-52 flex-col">
                      <span className="font-semibold text-white">
                        {item.name}
                      </span>

                      <span className="mt-1 text-xs text-slate-400">
                        {item.phone}
                      </span>

                      {item.sectorName && (
                        <span className="mt-2 w-fit rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-400">
                          {item.sectorName}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-4 text-center font-medium text-slate-200">
                    {item.projectsCount}
                  </td>

                  <td className="px-3 py-4 text-center font-medium text-slate-200">
                    {item.totalTickets}
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="warning">
                      {item.openTickets}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="danger">
                      {item.overdueTickets}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="success">
                      {item.answeredOnTime}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="default">
                      {item.answeredLate}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="manual">
                      {item.closedManual}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="neutral">
                      {item.noResponseNeeded}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <Badge tone="highlight">
                      {item.totalHandled}
                    </Badge>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-slate-200">
                        {handledPercentage}%
                      </span>

                      <div className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full bg-cyan-500"
                          style={{
                            width: `${Math.min(
                              handledPercentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex min-w-32 flex-col items-end">
                      <span
                        className={
                          item.responseCount > 0
                            ? "font-semibold text-emerald-300"
                            : "font-medium text-slate-500"
                        }
                      >
                        {averageLabel}
                      </span>

                      <span className="mt-1 text-xs text-slate-500">
                        {item.responseCount > 0
                          ? `${item.responseCount} ${
                              item.responseCount === 1
                                ? "resposta válida"
                                : "respostas válidas"
                            }`
                          : "Nenhuma resposta registrada"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-500">
        Deslize horizontalmente para visualizar todas as
        métricas.
      </div>
    </div>
  );
}
