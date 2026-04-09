"use client";

import { useEffect, useState } from "react";
import { useAutoRefresh } from "../../components/useAutoRefresh";
import {
  getSummary,
  getUsers,
  getDelays,
  getOpenTickets,
  getUsersList,
  getProjects,
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
  const [sectorOptions, setSectorOptions] = useState<any[]>([]);

  const [period, setPeriod] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");

  const [loading, setLoading] = useState(true);

  // 🔹 Carregar usuários
  useEffect(() => {
    async function loadUsersOptions() {
      try {
        const data = await getUsersList();
        setUserOptions(data);
      } catch (error) {
        console.error("Erro ao carregar usuários", error);
      }
    }

    loadUsersOptions();
  }, []);

  // 🔹 Carregar setores (via projects)
  useEffect(() => {
    async function loadSectors() {
      try {
        const projects = await getProjects();

        const sectorsMap = new Map();

        projects.forEach((p: any) => {
          if (p.sectorId && p.sector?.name) {
            sectorsMap.set(p.sectorId, {
              id: p.sectorId,
              name: p.sector.name,
            });
          }
        });

        setSectorOptions(Array.from(sectorsMap.values()));
      } catch (error) {
        console.error("Erro ao carregar setores", error);
      }
    }

    loadSectors();
  }, []);

  // 🔹 Carregar dashboard
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const filters = {
          period,
          userId: selectedUserId || undefined,
          sectorId: selectedSectorId || undefined,
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
  }, [period, selectedUserId, selectedSectorId]);

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
              <p className="text-sm font-medium text-slate-400">
                Operação Multi-Setor
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-white">
                Dashboard SLA WhatsApp
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Acompanhe projetos, atrasos e tempo médio de resposta por setor.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 shadow-sm">
              Atualizado em{" "}
              <span className="font-semibold text-white">
                {new Date(summary.generatedAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </header>

          {/* 🔥 FILTROS */}
          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Filtros</h2>
              <p className="mt-1 text-sm text-slate-400">
                Filtre por período, responsável e setor.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {/* PERÍODO */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Período
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                >
                  <option value="all">Todo o período</option>
                  <option value="today">Hoje</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                </select>
              </div>

              {/* CS */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  CS
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                >
                  <option value="">Todos</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔥 SETOR */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Setor
                </label>
                <select
                  value={selectedSectorId}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                >
                  <option value="">Todos os setores</option>
                  {sectorOptions.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* INFO */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-500">Período</p>
                <p className="text-sm text-white">{period}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-500">Setor</p>
                <p className="text-sm text-white">
                  {selectedSectorId
                    ? sectorOptions.find((s) => s.id === selectedSectorId)
                        ?.name
                    : "Todos"}
                </p>
              </div>
            </div>
          </section>

          {/* CARDS */}
          <section className="mb-8">
            <SummaryCards summary={summary} />
          </section>

          {/* OPEN */}
          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl text-white mb-4">Atendimento ao vivo</h2>
            <OpenTicketsTable items={openTickets} />
          </section>

          {/* USERS + DELAYS */}
          <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <UsersTable items={users} />
            <DelaysTable items={delays} />
          </section>
        </div>
      </main>
    </AppShell>
  );
}