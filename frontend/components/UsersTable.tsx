type UserRow = {
  userId: string;
  name: string;
  phone: string;
  projectsCount: number;
  totalTickets: number;
  openTickets: number;
  overdueTickets: number;
  answeredOnTime: number;
  answeredLate: number;
  avgResponseTimeMinutes: number;
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneMap = {
    default: "bg-slate-100 text-slate-700",
    danger: "bg-rose-100 text-rose-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

export function UsersTable({ items }: { items: UserRow[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        Nenhum CS encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4 font-semibold">CS</th>
            <th className="pb-3 pr-4 font-semibold">Projetos</th>
            <th className="pb-3 pr-4 font-semibold">Tickets</th>
            <th className="pb-3 pr-4 font-semibold">Abertos</th>
            <th className="pb-3 pr-4 font-semibold">Atrasados</th>
            <th className="pb-3 pr-4 font-semibold">No prazo</th>
            <th className="pb-3 pr-4 font-semibold">Com atraso</th>
            <th className="pb-3 font-semibold">Média</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.userId} className="border-b border-slate-100 last:border-0">
              <td className="py-4 pr-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-100">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.phone}</span>
                </div>
              </td>

              <td className="py-4 pr-4 text-slate-700">{item.projectsCount}</td>
              <td className="py-4 pr-4 text-slate-700">{item.totalTickets}</td>
              <td className="py-4 pr-4">
                <Badge tone="warning">{item.openTickets}</Badge>
              </td>
              <td className="py-4 pr-4">
                <Badge tone="danger">{item.overdueTickets}</Badge>
              </td>
              <td className="py-4 pr-4">
                <Badge tone="success">{item.answeredOnTime}</Badge>
              </td>
              <td className="py-4 pr-4">
                <Badge tone="default">{item.answeredLate}</Badge>
              </td>
              <td className="py-4 font-medium text-slate-900">
                {item.avgResponseTimeMinutes} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}