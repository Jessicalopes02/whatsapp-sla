"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { useAutoRefresh } from "../../components/useAutoRefresh";
import {
  getDebugNotifications,
  getDelays,
  getFailedDebugNotifications,
  getOpenTickets,
  getProjects,
  getUsersList,
} from "../../services/api";

type LiveBoardItem = {
  id: string;
  projectId: string;
  projectName: string;
  groupName: string;
  sectorId?: string | null;
  sectorName?: string | null;
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

type DebugNotification = {
  id: string;
  type: string;
  status: string;
  payload: {
    kind?: string;
    phone?: string;
    projectName?: string;
    minutesToDeadline?: number;
    delayMinutes?: number;
    error?: string | null;
  };
  createdAt: string;
};

type ManualCloseStatus = "closed_manual" | "no_response_needed";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

async function closeTicket(
  id: string,
  status: ManualCloseStatus
): Promise<void> {
  const res = await fetch(`http://localhost:3333/sla-tickets/${id}/close`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Erro ao encerrar ticket");
  }
}

function LiveTicketCard({
  ticket,
  onCloseTicket,
  closingTicketId,
}: {
  ticket: LiveBoardItem;
  onCloseTicket: (ticketId: string, status: ManualCloseStatus) => Promise<void>;
  closingTicketId: string | null;
}) {
  const isClosing = closingTicketId === ticket.id;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{ticket.projectName}</h3>
          <p className="mt-1 text-sm text-slate-400">{ticket.groupName}</p>
          {ticket.sectorName && (
            <p className="mt-1 text-xs text-slate-500">Setor: {ticket.sectorName}</p>
          )}
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            ticket.isOverdue
              ? "bg-rose-500/20 text-rose-300"
              : ticket.isNearDeadline
              ? "bg-amber-500/20 text-amber-300"
              : "bg-sky-500/20 text-sky-300"
          }`}
        >
          {ticket.badgeLabel} {ticket.displayMinutes} min
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Responsável
          </p>
          <p className="mt-3 font-semibold text-white">{ticket.responsibleName}</p>
          <p className="mt-1 text-sm text-slate-400">{ticket.responsiblePhone}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Janela do SLA
          </p>
          <p className="mt-3 text-sm text-slate-300">
            <span className="font-medium text-white">Abertura:</span>{" "}
            {formatDate(ticket.openedAt)}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            <span className="font-medium text-white">Deadline:</span>{" "}
            {formatDate(ticket.deadlineAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">
          {ticket.isOverdue ? (
            <>
              <span className="font-semibold text-rose-300">Em atraso.</span>{" "}
              Este ticket já ultrapassou o prazo configurado.
            </>
          ) : (
            <>
              <span className="font-semibold text-sky-300">
                Prazo restante:
              </span>{" "}
              {ticket.minutesToDeadline} min para o vencimento.
            </>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isClosing}
            onClick={() => onCloseTicket(ticket.id, "closed_manual")}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClosing ? "Encerrando..." : "Encerrar ticket"}
          </button>

          <button
            type="button"
            disabled={isClosing}
            onClick={() => onCloseTicket(ticket.id, "no_response_needed")}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sem resposta necessária
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  useAutoRefresh(30000);

  const [openTickets, setOpenTickets] = useState<any[]>([]);
  const [delays, setDelays] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<DebugNotification[]>([]);
  const [failedNotifications, setFailedNotifications] = useState<
    DebugNotification[]
  >([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [sectorOptions, setSectorOptions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

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
        console.error("Erro ao carregar filtros do LIVE", error);
      }
    }

    loadFilters();
  }, []);

  async function loadLive() {
    try {
      setLoading(true);

      const filters = {
        userId: selectedUserId || undefined,
        sectorId: selectedSectorId || undefined,
      };

      const [openData, overdueData, notificationData, failedData] =
        await Promise.all([
          getOpenTickets(filters),
          getDelays(filters),
          getDebugNotifications(),
          getFailedDebugNotifications(),
        ]);

      setOpenTickets(openData);
      setDelays(overdueData);
      setNotifications(notificationData);
      setFailedNotifications(failedData);
    } catch (error) {
      console.error("Erro ao carregar painel LIVE", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLive();
  }, [selectedUserId, selectedSectorId]);

  async function handleCloseTicket(
    ticketId: string,
    status: ManualCloseStatus
  ) {
    try {
      setClosingTicketId(ticketId);
      await closeTicket(ticketId, status);
      await loadLive();
    } catch (error) {
      console.error("Erro ao encerrar ticket", error);
      alert("Não foi possível encerrar o ticket.");
    } finally {
      setClosingTicketId(null);
    }
  }

  const totalOpen = openTickets.length;
  const totalOverdue = delays.length;

  const mergedLiveItems: LiveBoardItem[] = useMemo(() => {
    const openMapped: LiveBoardItem[] = openTickets.map((item: any) => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
      groupName: item.groupName,
      sectorId: item.sectorId ?? null,
      sectorName: item.sectorName ?? null,
      responsibleName: item.responsibleName,
      responsiblePhone: item.responsiblePhone,
      openedAt: item.openedAt,
      deadlineAt: item.deadlineAt,
      displayMinutes: item.waitingMinutes,
      badgeLabel: "aguardando há",
      minutesToDeadline: item.minutesToDeadline,
      isNearDeadline: item.isNearDeadline,
      isOverdue: false,
    }));

    const overdueMapped: LiveBoardItem[] = delays.map((item: any) => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
      groupName: item.groupName,
      sectorId: item.sectorId ?? null,
      sectorName: item.sectorName ?? null,
      responsibleName: item.responsibleName,
      responsiblePhone: item.responsiblePhone,
      openedAt: item.openedAt,
      deadlineAt: item.deadlineAt,
      displayMinutes: item.delayMinutes,
      badgeLabel: "em atraso há",
      minutesToDeadline: -Math.abs(item.delayMinutes),
      isNearDeadline: false,
      isOverdue: true,
    }));

    const all = [...overdueMapped, ...openMapped];

    return all.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.displayMinutes - a.displayMinutes;
    });
  }, [openTickets, delays]);

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Operação ao vivo
            </p>
            <h1 className="text-3xl font-bold text-white">Painel LIVE</h1>
            <p className="mt-2 text-slate-400">
              Monitoramento em tempo real dos atendimentos abertos e atrasados.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:max-w-xl">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Filtrar por CS
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Todos os CS</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Filtrar por setor
                </label>
                <select
                  value={selectedSectorId}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Todos os setores</option>
                  {sectorOptions.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Link
              href="/live/tv"
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir modo TV
            </Link>
          </div>
        </header>

        {totalOverdue > 0 && (
          <div className="mb-6 rounded-2xl border border-rose-700 bg-rose-950/40 p-4">
            <p className="text-sm font-semibold text-rose-300">
              ⚠ Atenção: existem {totalOverdue} tickets com SLA vencido.
            </p>
          </div>
        )}

        {failedNotifications.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-700 bg-amber-950/30 p-4">
            <p className="text-sm font-semibold text-amber-300">
              ⚠ Existem {failedNotifications.length} alertas com falha de envio.
            </p>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Tickets abertos"
            value={totalOpen}
            hint="Aguardando primeira resposta"
            tone="info"
          />
          <SummaryCard
            title="Tickets atrasados"
            value={totalOverdue}
            hint="Com SLA já vencido"
            tone="danger"
          />
          <SummaryCard
            title="Monitorados agora"
            value={mergedLiveItems.length}
            hint="Abertos + atrasados"
            tone="default"
          />
          <SummaryCard
            title="Falhas de alerta"
            value={failedNotifications.length}
            hint="Envios que falharam"
            tone="warning"
          />
        </section>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Fila de atendimento
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Ordene a operação pelo que exige ação agora.
            </p>
          </div>

          {loading ? (
            <p className="text-slate-400">Carregando painel LIVE...</p>
          ) : mergedLiveItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              Nenhum ticket aberto no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {mergedLiveItems.map((ticket) => (
                <LiveTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onCloseTicket={handleCloseTicket}
                  closingTicketId={closingTicketId}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Debug de alertas
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Últimos alertas gerados pelo sistema.
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              Nenhum alerta encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const kind = notification.payload?.kind ?? "unknown";
                const projectName = notification.payload?.projectName ?? "-";

                return (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {kind === "warning"
                            ? "⚠ Alerta preventivo"
                            : "🚨 Alerta de atraso"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Projeto: {projectName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Telefone: {notification.payload?.phone ?? "-"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                          {kind}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                          {notification.status}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-slate-300">
                      {kind === "warning" ? (
                        <span>
                          Tempo restante:{" "}
                          {notification.payload?.minutesToDeadline ?? "-"} min
                        </span>
                      ) : (
                        <span>
                          Atraso atual:{" "}
                          {notification.payload?.delayMinutes ?? "-"} min
                        </span>
                      )}
                    </div>

                    {notification.status === "failed" &&
                      notification.payload?.error && (
                        <div className="mt-3 rounded-xl border border-rose-800 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
                          Erro: {notification.payload.error}
                        </div>
                      )}
                  </div>
                );
              })}
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
  tone?: "default" | "success" | "danger" | "info" | "warning";
}) {
  const toneMap = {
    default: "border-slate-800 bg-slate-900 text-white",
    success: "border-emerald-800 bg-emerald-950/30 text-emerald-200",
    danger: "border-rose-800 bg-rose-950/30 text-rose-200",
    info: "border-sky-800 bg-sky-950/30 text-sky-200",
    warning: "border-amber-800 bg-amber-950/30 text-amber-200",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm opacity-70">{hint}</p>
    </div>
  );
}