type LiveTicket = {
  id: string;
  projectId: string;
  projectName: string;
  groupName: string;
  responsibleName: string;
  responsiblePhone: string;
  openedAt: string;
  deadlineAt: string;
  displayMinutes: number;
  badgeLabel: string;
  minutesToDeadline: number;
  isNearDeadline: boolean;
  isOverdue: boolean;
};

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  let result = "";

  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (mins > 0 || result === "") result += `${mins}m`;

  return result.trim();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function getTone(ticket: LiveTicket) {
  if (ticket.isOverdue) {
    return {
      wrapper: "border-rose-700 bg-rose-950/40",
      badge: "bg-rose-600 text-white",
      title: "text-rose-200",
      subtitle: "text-rose-300/80",
      box: "border-rose-900/60 bg-slate-950/60",
      info: "text-rose-300",
    };
  }

  if (ticket.isNearDeadline) {
    return {
      wrapper: "border-amber-700 bg-amber-950/30",
      badge: "bg-amber-500 text-slate-950",
      title: "text-amber-100",
      subtitle: "text-amber-200/80",
      box: "border-amber-900/60 bg-slate-950/60",
      info: "text-amber-300",
    };
  }

  return {
    wrapper: "border-slate-800 bg-slate-900",
    badge: "bg-sky-600 text-white",
    title: "text-white",
    subtitle: "text-slate-400",
    box: "border-slate-800 bg-slate-950/60",
    info: "text-sky-300",
  };
}

export function LiveTicketsBoard({ items }: { items: LiveTicket[] }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
        Nenhum atendimento aberto no momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {items.map((item) => {
        const tone = getTone(item);

        return (
          <div
            key={item.id}
            className={`rounded-3xl border p-5 shadow-sm ${tone.wrapper}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className={`text-xl font-semibold ${tone.title}`}>
                  {item.projectName}
                </h3>
                <p className={`mt-1 text-sm ${tone.subtitle}`}>
                  {item.groupName}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
              >
                {item.badgeLabel} {formatDuration(item.displayMinutes)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${tone.box}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Responsável
                </p>
                <p className="mt-2 font-semibold text-white">
                  {item.responsibleName}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {item.responsiblePhone}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${tone.box}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Janela do SLA
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="font-medium text-white">Abertura:</span>{" "}
                  {formatDate(item.openedAt)}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  <span className="font-medium text-white">Deadline:</span>{" "}
                  {formatDate(item.deadlineAt)}
                </p>
              </div>
            </div>

            <div className={`mt-4 rounded-2xl border p-4 ${tone.box}`}>
              {item.isOverdue ? (
                <p className={`text-sm font-medium ${tone.info}`}>
                  SLA vencido. Atendimento precisa de ação imediata.
                </p>
              ) : item.isNearDeadline ? (
                <p className={`text-sm font-medium ${tone.info}`}>
                  Atenção: faltam {item.minutesToDeadline} min para o SLA vencer.
                </p>
              ) : (
                <p className={`text-sm font-medium ${tone.info}`}>
                  Restam {item.minutesToDeadline} min para o SLA.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}