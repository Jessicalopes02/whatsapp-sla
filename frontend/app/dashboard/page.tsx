"use client";

import { useEffect, useState } from "react";
import { useAutoRefresh } from "../../components/useAutoRefresh";
import {
  getSummary,
  getUsers,
  getDelays,
  getOpenTickets,
  getUsersList,
} from "../../services/api";
import { SummaryCards } from "../../components/SummaryCards";
import { UsersTable } from "../../components/UsersTable";
import { DelaysTable } from "../../components/DelaysTable";
import { OpenTicketsTable } from "../../components/OpenTicketsTable";
import { AppShell } from "../../components/AppShell";

export default function DashboardPage() {
  useAutoRefresh(30000);

  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [delays, setDelays] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [period, setPeriod] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsersOptions() {
      try {
        const data = await getUsersList();
        setUserOptions(data);
      } catch (error) {
        console.error("Erro ao carregar opções de usuários", error);
      }
    }

    loadUsersOptions();
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const filters = {
          period,
          userId: selectedUserId || undefined,
        };

        const [s, u, d, o] = await Promise.all([
          getSummary(filters),
          getUsers(filters),
          getDelays(filters),
          getOpenTickets(filters),
        ]);

        setSummary(s);
        setUsers(u);
        setDelays(d);
        setOpenTickets(o);
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [period, selectedUserId]);

  if (loading || !summary) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Carregando dashboard...
      </main>
    );
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Operação CS</p>

              <h1 className="text-3xl font-bold tracking-tight text-white">
                Dashboard SLA WhatsApp
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Acompanhe projetos, atrasos e tempo médio de resposta do time.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 shadow-sm">
              Atualizado em{" "}
              <span className="font-semibold text-white">
                {new Date(summary.generatedAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </header>

          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Filtros</h2>
              <p className="mt-1 text-sm text-slate-400">
                Filtre o painel por período e responsável.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Período
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">Todo o período</option>
                  <option value="today">Hoje</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  CS
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Todos os CS</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Período atual
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {period === "all"
                    ? "Todo o período"
                    : period === "today"
                    ? "Hoje"
                    : period === "7d"
                    ? "Últimos 7 dias"
                    : "Últimos 30 dias"}
                </p>
              </div>

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
            </div>
          </section>

          <section className="mb-8">
            <SummaryCards summary={summary} />
          </section>

          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-100">
                Atendimento ao vivo
              </h2>

              <p className="text-sm text-slate-400">
                Tickets abertos aguardando primeira resposta.
              </p>
            </div>

            <OpenTicketsTable items={openTickets} />
          </section>

          <section className="mb-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                  Métricas por CS
                </h2>

                <p className="text-sm text-slate-400">
                  Visão consolidada por responsável.
                </p>
              </div>

              <UsersTable items={users} />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                  Atrasos em aberto
                </h2>

                <p className="text-sm text-slate-400">
                  Tickets com SLA vencido aguardando retorno.
                </p>
              </div>

              <DelaysTable items={delays} />
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}