"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { getProjects } from "../../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        setProjects(data);
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

    if (!normalized) return projects;

    return projects.filter((project) => {
      const projectName = project.name?.toLowerCase() ?? "";
      const groupName = project.groupName?.toLowerCase() ?? "";
      const responsibleName =
        project.responsibleUser?.name?.toLowerCase() ?? "";
      const responsiblePhone =
        project.responsibleUser?.phone?.toLowerCase() ?? "";

      return (
        projectName.includes(normalized) ||
        groupName.includes(normalized) ||
        responsibleName.includes(normalized) ||
        responsiblePhone.includes(normalized)
      );
    });
  }, [projects, query]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.active).length;
  const inactiveProjects = projects.filter((project) => !project.active).length;
  const projectsWithResponsible = projects.filter(
    (project) => project.responsibleUser
  ).length;

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-400">Consulta</p>

          <h1 className="text-3xl font-bold text-white">Projetos</h1>

          <p className="mt-2 text-slate-400">
            Cada grupo possui um único CS responsável fixo para métricas e SLA.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de projetos"
            value={totalProjects}
            hint="Projetos cadastrados/importados"
            tone="default"
          />

          <SummaryCard
            title="Projetos ativos"
            value={activeProjects}
            hint="Projetos monitorados agora"
            tone="success"
          />

          <SummaryCard
            title="Projetos inativos"
            value={inactiveProjects}
            hint="Projetos pausados ou desativados"
            tone="danger"
          />

          <SummaryCard
            title="Com CS definido"
            value={projectsWithResponsible}
            hint="Projetos com responsável encontrado"
            tone="info"
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Lista de projetos e grupos
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Busque por projeto, grupo, nome do CS ou telefone.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                type="text"
                placeholder="Buscar projeto, grupo ou responsável..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400">Carregando projetos...</p>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              Nenhum projeto encontrado para essa busca.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {project.groupName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ID do grupo: {project.groupExternalId}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                        SLA {project.slaMinutes} min
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          project.active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {project.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Responsável fixo
                      </p>

                      {project.responsibleUser ? (
                        <div className="mt-3">
                          <p className="font-semibold text-white">
                            {project.responsibleUser.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {project.responsibleUser.phone}
                          </p>
                          <p className="mt-2 inline-flex rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
                            {project.responsibleUser.role}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm text-rose-300">
                            Nenhum CS encontrado para este grupo.
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Quando a integração chegar, esse vínculo poderá ser
                            identificado pelo número do responsável.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Regras operacionais
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        <p>
                          <span className="font-medium text-white">Grupo:</span>{" "}
                          1 projeto monitorado
                        </p>
                        <p>
                          <span className="font-medium text-white">CS:</span> 1
                          responsável fixo
                        </p>
                        <p>
                          <span className="font-medium text-white">Métrica:</span>{" "}
                          toda interação conta para este responsável
                        </p>
                        <p>
                          <span className="font-medium text-white">SLA:</span>{" "}
                          {project.slaMinutes} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
  tone?: "default" | "success" | "danger" | "info";
}) {
  const toneMap = {
    default: "border-slate-800 bg-slate-900 text-white",
    success: "border-emerald-800 bg-emerald-950/30 text-emerald-200",
    danger: "border-rose-800 bg-rose-950/30 text-rose-200",
    info: "border-sky-800 bg-sky-950/30 text-sky-200",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm opacity-70">{hint}</p>
    </div>
  );
}