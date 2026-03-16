type DelayRow = {
  id: string;
  projectId: string;
  projectName: string;
  groupName: string;
  responsibleName: string;
  responsiblePhone: string;
  openedAt: string;
  deadlineAt: string;
  delaySeconds: number | null;
  delayMinutes: number;
  privateNotificationSent: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export function DelaysTable({ items }: { items: DelayRow[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        Nenhum atraso em aberto no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{item.projectName}</h3>
              <p className="text-sm text-slate-600">{item.groupName}</p>
            </div>

            <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
              {item.delayMinutes} min de atraso
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
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

          <div className="mt-3 text-xs text-slate-500">
            Notificação privada enviada:{" "}
            <span className="font-semibold text-slate-700">
              {item.privateNotificationSent ? "Sim" : "Não"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}