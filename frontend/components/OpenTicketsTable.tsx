type OpenTicketRow = {
  id: string;
  projectId: string;
  projectName: string;
  groupName: string;
  responsibleName: string;
  responsiblePhone: string;
  openedAt: string;
  deadlineAt: string;
  waitingMinutes: number;
  minutesToDeadline: number;
  isNearDeadline: boolean;
  isOverdue: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export function OpenTicketsTable({ items }: { items: OpenTicketRow[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        Nenhum ticket aberto no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const badgeClass = item.isOverdue
          ? "bg-rose-600 text-white animate-pulse"
          : item.isNearDeadline
          ? "bg-amber-500 text-slate-950 animate-pulse"
          : "bg-sky-600 text-white";

        const cardClass = item.isOverdue
          ? "border-rose-800 bg-rose-950/40"
          : item.isNearDeadline
          ? "border-amber-700 bg-amber-950/30"
          : "border-slate-800 bg-slate-900";

        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${cardClass}`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">
                  {item.projectName}
                </h3>
                <p className="text-sm text-slate-400">{item.groupName}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
              >
                aguardando há {item.waitingMinutes} min
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Responsável:</span>{" "}
                  {item.responsibleName}
                </p>

                <p>
                  <span className="font-medium">Telefone:</span>{" "}
                  {item.responsiblePhone}
                </p>
              </div>

              <div>
                <p>
                  <span className="font-medium">Aberto em:</span>{" "}
                  {formatDate(item.openedAt)}
                </p>

                <p>
                  <span className="font-medium">Deadline:</span>{" "}
                  {formatDate(item.deadlineAt)}
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              {item.isOverdue
                ? "Prazo vencido."
                : item.isNearDeadline
                ? `Faltam ${item.minutesToDeadline} min para vencer.`
                : `Faltam ${item.minutesToDeadline} min para o deadline.`}
            </div>
          </div>
        );
      })}
    </div>
  );
}