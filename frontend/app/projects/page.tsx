"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import {
  getProjects,
  getUsersList,
  getSectors,
  updateProject,
} from "../../services/api";

type ProjectItem = {
  id: string;
  name: string;
  groupExternalId: string;
  groupName: string;
  responsibleUserId?: string | null;
  sectorId?: string | null;
  slaMinutes: number;
  active: boolean;
  responsibleUser?: {
    id: string;
    name: string;
    phone: string;
    role: string;
  } | null;
  sector?: {
    id: string;
    name: string;
    defaultSlaMinutes: number;
  } | null;
};

type UserItem = {
  id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
};

type SectorItem = {
  id: string;
  name: string;
  defaultSlaMinutes: number;
  active: boolean;
};

function getDefaultSlaByRole(role?: string) {
  if (role === "sales_support") return 120;
  if (role === "cs") return 60;
  if (role === "comercial") return 60;
  return 60;
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
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProjectCard({
  project,
  users,
  sectors,
  onSaved,
}: {
  project: ProjectItem;
  users: UserItem[];
  sectors: SectorItem[];
  onSaved: () => Promise<void>;
}) {
  const isConfigured = !!project.responsibleUserId && !!project.sectorId;

  const [isEditing, setIsEditing] = useState(!isConfigured);
  const [selectedUserId, setSelectedUserId] = useState(
    project.responsibleUserId ?? ""
  );
  const [selectedSectorId, setSelectedSectorId] = useState(
    project.sectorId ?? ""
  );
  const [slaMinutes, setSlaMinutes] = useState(project.slaMinutes || 60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedUserId(project.responsibleUserId ?? "");
    setSelectedSectorId(project.sectorId ?? "");
    setSlaMinutes(project.slaMinutes || 60);
    setIsEditing(!isConfigured);
  }, [
    project.id,
    project.responsibleUserId,
    project.sectorId,
    project.slaMinutes,
    isConfigured,
  ]);

  function handleUserChange(userId: string) {
    setSelectedUserId(userId);

    const selectedUser = users.find((user) => user.id === userId);
    if (selectedUser) {
      setSlaMinutes(getDefaultSlaByRole(selectedUser.role));
    }
  }

  async function handleSave() {
    try {
      if (!selectedUserId || !selectedSectorId) {
        alert("Selecione responsável e setor.");
        return;
      }

      setSaving(true);

      await updateProject(project.id, {
        responsibleUserId: selectedUserId,
        sectorId: selectedSectorId,
        slaMinutes,
      });

      await onSaved();
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar projeto", error);
      alert("Não foi possível salvar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-white">{project.name}</h3>

        <p className="text-sm text-slate-400">{project.groupName}</p>

        <p className="text-xs text-slate-500">
          ID do grupo: {project.groupExternalId}
        </p>
      </div>

      {!isEditing ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Responsável
              </p>
              <p className="mt-3 text-sm text-slate-200">
                {project.responsibleUser
                  ? `${project.responsibleUser.name} (${project.responsibleUser.phone})`
                  : "Não definido"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Setor
              </p>
              <p className="mt-3 text-sm text-slate-200">
                {project.sector?.name ?? "Não definido"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <p>SLA atual: {project.slaMinutes} min</p>
            <p className="mt-1">
              Status: {project.active ? "Ativo" : "Inativo"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-4 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Editar projeto
          </button>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-amber-800 bg-amber-950/20 p-4">
            <p className="text-sm font-semibold text-amber-300">
              {isConfigured ? "Edição do projeto" : "Cadastro pendente"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Defina responsável, setor e SLA para ativar o fluxo corretamente.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Responsável
              </label>

              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Selecionar responsável</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Atual:{" "}
                {project.responsibleUser
                  ? `${project.responsibleUser.name} (${project.responsibleUser.phone})`
                  : "Não definido"}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Setor
              </label>

              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Selecionar setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Atual: {project.sector?.name ?? "Não definido"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              SLA (minutos)
            </label>

            <input
              type="number"
              min={1}
              value={slaMinutes}
              onChange={(e) => setSlaMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : isConfigured ? "Salvar edição" : "Cadastrar projeto"}
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [projectsData, usersData, sectorsData] = await Promise.all([
        getProjects(),
        getUsersList(),
        getSectors(),
      ]);

      setProjects(projectsData);
      setUsers(usersData.filter((user: UserItem) => user.active));
      setSectors(sectorsData.filter((sector: SectorItem) => sector.active));
    } catch (error) {
      console.error("Erro ao carregar projetos", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
  const configuredProjects = projects.filter(
    (project) => !!project.responsibleUserId && !!project.sectorId
  ).length;
  const pendingConfiguration = projects.filter(
    (project) => !project.responsibleUserId || !project.sectorId
  ).length;

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8">
          <p className="text-sm text-slate-400">Gestão</p>
          <h1 className="text-3xl font-bold text-white">Projetos</h1>
          <p className="mt-2 text-sm text-slate-400">
            Grupos recebidos diretamente do WhatsApp para definição de
            responsável, setor e acompanhamento operacional.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard title="Total" value={totalProjects} />
          <SummaryCard title="Configurados" value={configuredProjects} />
          <SummaryCard title="Pendentes" value={pendingConfiguration} />
        </section>

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
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <p className="text-slate-400">Carregando...</p>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
            Nenhum projeto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                users={users}
                sectors={sectors}
                onSaved={loadData}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}