"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { getProjects } from "../../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [sectorOptions, setSectorOptions] = useState<any[]>([]);

   useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        setProjects(data);

        // 🔥 extrair setores únicos dos projetos
        const sectorsMap = new Map();

        data.forEach((project: any) => {
          if (project.sectorId && project.sector?.name) {
            sectorsMap.set(project.sectorId, {
              id: project.sectorId,
              name: project.sector.name,
            });
          }
        });

        setSectorOptions(Array.from(sectorsMap.values()));
      } catch (error) {
        console.error("Erro ao carregar projetos", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesQuery =
        !normalized ||
        project.name?.toLowerCase().includes(normalized) ||
        project.groupName?.toLowerCase().includes(normalized) ||
        project.responsibleUser?.name?.toLowerCase().includes(normalized) ||
        project.responsibleUser?.phone?.toLowerCase().includes(normalized) ||
        project.sector?.name?.toLowerCase().includes(normalized);

      const matchesSector =
        !selectedSectorId || project.sectorId === selectedSectorId;

      return matchesQuery && matchesSector;
    });
  }, [projects, query, selectedSectorId]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.active).length;
  const inactiveProjects = projects.filter((p) => !p.active).length;

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8">
          <p className="text-sm text-slate-400">Consulta</p>
          <h1 className="text-3xl font-bold text-white">Projetos</h1>
        </header>

        {/* 🔥 FILTROS */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            type="text"
            placeholder="Buscar projeto, grupo ou responsável..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          />

          <select
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          >
            <option value="">Todos os setores</option>
            {sectorOptions.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </section>

        {/* 🔥 CARDS */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total" value={totalProjects} />
          <SummaryCard title="Ativos" value={activeProjects} />
          <SummaryCard title="Inativos" value={inactiveProjects} />
        </section>

        {/* 🔥 LISTA */}
        {loading ? (
          <p className="text-slate-400">Carregando...</p>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <h3 className="text-white font-semibold text-lg">
                  {project.name}
                </h3>

                <p className="text-slate-400 text-sm">
                  {project.groupName}
                </p>

                {/* 🔥 SETOR */}
                <p className="text-xs text-slate-500 mt-1">
                  Setor: {project.sector?.name ?? "Não definido"}
                </p>

                <div className="mt-3 text-sm text-slate-300">
                  SLA: {project.slaMinutes} min
                </div>

                {project.responsibleUser && (
                  <div className="mt-3 text-sm text-slate-300">
                    Responsável: {project.responsibleUser.name} (
                    {project.responsibleUser.phone})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl text-white font-bold">{value}</p>
    </div>
  );
}