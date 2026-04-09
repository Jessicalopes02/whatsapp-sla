"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { getHistory, getProjects, getUsersList } from "../../services/api";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function statusLabel(status: string) {
  switch (status) {
    case "answered_on_time":
      return {
        label: "Respondido no prazo",
        className: "bg-emerald-500/20 text-emerald-300",
      };
    case "answered_late":
      return {
        label: "Respondido com atraso",
        className: "bg-amber-500/20 text-amber-300",
      };
    case "overdue":
      return {
        label: "Atrasado",
        className: "bg-rose-500/20 text-rose-300",
      };
    case "open":
      return {
        label: "Aberto",
        className: "bg-sky-500/20 text-sky-300",
      };
    default:
      return {
        label: status,
        className: "bg-slate-700 text-slate-300",
      };
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");

  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [sectorOptions, setSectorOptions] = useState<any[]>([]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [users, projects] = await Promise.all([
          getUsersList(),
          getProjects(),
        ]);

        setUserOptions(users);

        const sectorsMap = new Map();

        projects.forEach((project: any) => {
          if (project.sectorId && project.sector?.name) {
            sectorsMap.set(project.sectorId, {
              id: project.sectorId,
              name: project.sector.name,
            });
          }
        });

        setSectorOptions(Array.from(sectorsMap.values()));
      } catch (error) {
        console.error("Erro ao carregar filtros do histórico", error);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const data = await getHistory({
          period,
          userId: selectedUserId || undefined,
          sectorId: selectedSectorId || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });

        setItems(data);
      } catch (error) {
        console.error("Erro ao carregar histórico", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [period, selectedUserId, selectedSectorId, statusFilter]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalized ||
        item.projectName?.toLowerCase().includes(normalized) ||
        item.groupName?.toLowerCase().includes(normalized) ||
        item.responsibleName?.toLowerCase().includes(normalized) ||
        item.responsiblePhone?.toLowerCase().includes(normalized) ||
        item.sectorName?.toLowerCase().includes(normalized);

      return matchesQuery;
    });
  }, [items, query]);

  const totalTickets = items.length;
  const onTimeCount = items.filter(
    (item) => item.status === "answered_on_time"
  ).length;
  const lateCount = items.filter(
    (item) => item.status === "answered_late"
  ).length;
  const overdueCount = items.filter(
    (item) => item.status === "overdue"
  ).length;

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-400">Operação</p>

          <h1 className="text-3xl font-bold text-white">Histórico</h1>

          <p className="mt-2 text-slate-400">
            Histórico de tickets e SLAs processados pelo sistema.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de tickets"
            value={totalTickets}
            hint="Todos os tickets registrados"
            tone="default"
          />

          <SummaryCard
            title="No prazo"
            value={onTimeCount}
            hint="Respondidos dentro do SLA"
            tone="success"
          />

          <SummaryCard
            title="Com atraso"
            value={lateCount}
            hint="Respondidos após o prazo"
            tone="warning"
          />

          <SummaryCard
            title="Atrasados"
            value={overdueCount}
            hint="Ainda vencidos no sistema"
            tone="danger"
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Tickets processados
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Busque por projeto, grupo, responsável ou setor e filtre por status.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="text"
                placeholder="Buscar projeto, grupo, responsável ou setor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 xl:col-span-2"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="answered_on_time">Respondido no prazo</option>
                <option value="answered_late">Respondido com atraso</option>
                <option value="overdue">Atrasado</option>
                <option value="open">Aberto</option>
              </select>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">Todo o período</option>
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Todos os responsáveis</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Todos os setores</option>
                {sectorOptions.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Responsável atual
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {selectedUserId
                    ? userOptions.find((u) => u.id === selectedUserId)?.name ??
                      "Selecionado"
                    : "Todos"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Setor atual
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {selectedSectorId
                    ? sectorOptions.find((s) => s.id === selectedSectorId)?.name ??
                      "Selecionado"
                    : "Todos"}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400">Carregando histórico...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              Nenhum ticket encontrado para os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">Projeto</th>
                    <th className="pb-3 pr-4 font-semibold">Setor</th>
                    <th className="pb-3 pr-4 font-semibold">Responsável</th>
                    <th className="pb-3 pr-4 font-semibold">Abertura</th>
                    <th className="pb-3 pr-4 font-semibold">Deadline</th>
                    <th className="pb-3 pr-4 font-semibold">Resposta</th>
                    <th className="pb-3 pr-4 font-semibold">Tempo</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => {
                    const status = statusLabel(item.status);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800 last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">
                              {item.projectName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.groupName}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 pr-4 text-slate-300">
                          {item.sectorName ?? "-"}
                        </td>

                        <td className="py-4 pr-4">
                          <div className="flex flex-col">
                            <span className="text-slate-300">
                              {item.responsibleName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.responsiblePhone}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 pr-4 text-slate-300">
                          {formatDate(item.openedAt)}
                        </td>

                        <td className="py-4 pr-4 text-slate-300">
                          {formatDate(item.deadlineAt)}
                        </td>

                        <td className="py-4 pr-4 text-slate-300">
                          {formatDate(item.answeredAt)}
                        </td>

                        <td className="py-4 pr-4 text-slate-300">
                          {item.responseMinutes !== null
                            ? `${item.responseMinutes} min`
                            : "-"}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneMap = {
    default: "border-slate-800 bg-slate-900 text-white",
    success: "border-emerald-800 bg-emerald-950/30 text-emerald-200",
    warning: "border-amber-800 bg-amber-950/30 text-amber-200",
    danger: "border-rose-800 bg-rose-950/30 text-rose-200",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm opacity-70">{hint}</p>
    </div>
  );
}