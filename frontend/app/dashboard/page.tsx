"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getSummary,
  getUsers,
  getDelays,
  getOpenTickets,
  getUsersList,
  getSectors,
} from "../../services/api";

import { SummaryCards } from "../../components/SummaryCards";
import { UsersTable } from "../../components/UsersTable";
import { DelaysTable } from "../../components/DelaysTable";
import { OpenTicketsTable } from "../../components/OpenTicketsTable";
import { AppShell } from "../../components/AppShell";

type SummaryData = {
  generatedAt: string;
  period: string;
  userId: string | null;
  sectorId: string | null;

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

type UserOption = {
  id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
};

type SectorOption = {
  id: string;
  name: string;
  defaultSlaMinutes: number;
  active: boolean;
};

function getPeriodLabel(period: string) {
  if (period === "today") {
    return "Hoje";
  }

  if (period === "7d") {
    return "Últimos 7 dias";
  }

  if (period === "30d") {
    return "Últimos 30 dias";
  }

  return "Todo o período";
}

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<SummaryData | null>(null);

  const [users, setUsers] =
    useState<any[]>([]);

  const [delays, setDelays] =
    useState<any[]>([]);

  const [openTickets, setOpenTickets] =
    useState<any[]>([]);

  const [userOptions, setUserOptions] =
    useState<UserOption[]>([]);

  const [sectorOptions, setSectorOptions] =
    useState<SectorOption[]>([]);

  const [period, setPeriod] =
    useState("all");

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState("");

  const [
    selectedSectorId,
    setSelectedSectorId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /**
   * Carrega as opções dos filtros.
   */
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [
          usersData,
          sectorsData,
        ] = await Promise.all([
          getUsersList(),
          getSectors(),
        ]);

        setUserOptions(
          usersData.filter(
            (user: UserOption) =>
              user.active
          )
        );

        setSectorOptions(
          sectorsData.filter(
            (sector: SectorOption) =>
              sector.active
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar filtros:",
          error
        );
      }
    }

    loadFilterOptions();
  }, []);

  /**
   * Carrega todos os dados do dashboard.
   */
  const loadDashboard =
    useCallback(
      async (
        showFullLoading = false
      ) => {
        try {
          if (showFullLoading) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          const filters = {
            period,

            userId:
              selectedUserId ||
              undefined,

            sectorId:
              selectedSectorId ||
              undefined,
          };

          const [
            summaryData,
            usersData,
            delaysData,
            openTicketsData,
          ] = await Promise.all([
            getSummary(filters),
            getUsers(filters),
            getDelays(filters),
            getOpenTickets(filters),
          ]);

          setSummary(summaryData);
          setUsers(usersData);
          setDelays(delaysData);
          setOpenTickets(
            openTicketsData
          );
        } catch (error) {
          console.error(
            "Erro ao carregar dashboard:",
            error
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        period,
        selectedUserId,
        selectedSectorId,
      ]
    );

  /**
   * Atualização inicial e automática
   * a cada 30 segundos.
   */
  useEffect(() => {
    loadDashboard(true);

    const intervalId =
      window.setInterval(() => {
        loadDashboard(false);
      }, 30000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [loadDashboard]);

  function clearFilters() {
    setPeriod("all");
    setSelectedUserId("");
    setSelectedSectorId("");
  }

  const selectedUser =
    userOptions.find(
      (user) =>
        user.id === selectedUserId
    );

  const selectedSector =
    sectorOptions.find(
      (sector) =>
        sector.id ===
        selectedSectorId
    );

  if (loading || !summary) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-400">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6 text-center">
          <p className="font-medium text-white">
            Carregando dashboard...
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Buscando métricas,
            responsáveis e tickets.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-400">
                Operação Multi-Setor
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Dashboard SLA WhatsApp
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Acompanhe os atendimentos,
                atrasos, tratamentos e o
                desempenho de cada responsável.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                <span className="text-slate-500">
                  Atualizado em
                </span>

                <span className="ml-2 font-semibold text-white">
                  {new Date(
                    summary.generatedAt
                  ).toLocaleString(
                    "pt-BR"
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadDashboard(false)
                }
                disabled={refreshing}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing
                  ? "Atualizando..."
                  : "Atualizar"}
              </button>
            </div>
          </header>

          {/* FILTROS */}
          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Filtros
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Selecione o período, o
                  responsável ou o setor.
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 md:self-auto"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Período
                </label>

                <select
                  value={period}
                  onChange={(event) =>
                    setPeriod(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                >
                  <option value="all">
                    Todo o período
                  </option>

                  <option value="today">
                    Hoje
                  </option>

                  <option value="7d">
                    Últimos 7 dias
                  </option>

                  <option value="30d">
                    Últimos 30 dias
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Responsável
                </label>

                <select
                  value={
                    selectedUserId
                  }
                  onChange={(event) =>
                    setSelectedUserId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                >
                  <option value="">
                    Todos os responsáveis
                  </option>

                  {userOptions.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Setor
                </label>

                <select
                  value={
                    selectedSectorId
                  }
                  onChange={(event) =>
                    setSelectedSectorId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                >
                  <option value="">
                    Todos os setores
                  </option>

                  {sectorOptions.map(
                    (sector) => (
                      <option
                        key={sector.id}
                        value={sector.id}
                      >
                        {sector.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                Período:{" "}
                <strong className="text-white">
                  {getPeriodLabel(
                    period
                  )}
                </strong>
              </div>

              <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                Responsável:{" "}
                <strong className="text-white">
                  {selectedUser?.name ??
                    "Todos"}
                </strong>
              </div>

              <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                Setor:{" "}
                <strong className="text-white">
                  {selectedSector?.name ??
                    "Todos"}
                </strong>
              </div>
            </div>
          </section>

          {/* MÉTRICAS GERAIS */}
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">
                Visão geral
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Indicadores gerais dos
                atendimentos monitorados.
              </p>
            </div>

            <SummaryCards
              summary={summary}
            />
          </section>

          {/* ATENDIMENTO E ATRASOS */}
          <section className="mb-8 grid grid-cols-1 gap-8 2xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">
                  Atendimento ao vivo
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Mensagens do cliente
                  aguardando tratamento.
                </p>
              </div>

              <OpenTicketsTable
                items={openTickets}
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">
                  Atendimentos atrasados
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Tickets que ultrapassaram
                  o prazo configurado.
                </p>
              </div>

              <DelaysTable
                items={delays}
              />
            </div>
          </section>

          {/* MÉTRICAS POR CS */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Desempenho por responsável
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Tickets recebidos,
                  tratados, encerrados e
                  tempo médio de resposta.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                {users.length}{" "}
                {users.length === 1
                  ? "responsável"
                  : "responsáveis"}
              </div>
            </div>

            <UsersTable items={users} />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
