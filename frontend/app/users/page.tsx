"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { createUser, getUsersList } from "../../services/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "cs",
  });

  async function loadUsers() {
    try {
      const data = await getUsersList();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return users;

    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? "";
      const phone = user.phone?.toLowerCase() ?? "";
      const role = user.role?.toLowerCase() ?? "";

      return (
        name.includes(normalized) ||
        phone.includes(normalized) ||
        role.includes(normalized)
      );
    });
  }, [users, query]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const inactiveUsers = users.filter((user) => !user.active).length;
  const csUsers = users.filter((user) => user.role === "cs").length;

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await createUser(form);

      setForm({
        name: "",
        phone: "",
        role: "cs",
      });

      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      console.error("Erro ao criar usuário", error);
      alert("Não foi possível criar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Cadastro</p>

            <h1 className="text-3xl font-bold text-white">CS</h1>

            <p className="mt-2 text-slate-400">
              Lista de responsáveis monitorados pelo sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Novo CS
          </button>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de usuários"
            value={totalUsers}
            hint="Usuários cadastrados no sistema"
            tone="default"
          />

          <SummaryCard
            title="CS ativos"
            value={csUsers}
            hint="Usuários com papel de CS"
            tone="success"
          />

          <SummaryCard
            title="Ativos"
            value={activeUsers}
            hint="Usuários em operação"
            tone="success"
          />

          <SummaryCard
            title="Inativos"
            value={inactiveUsers}
            hint="Usuários pausados ou desativados"
            tone="danger"
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Lista de responsáveis
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Busque por nome, telefone ou cargo.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                type="text"
                placeholder="Buscar nome, telefone ou cargo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400">Carregando usuários...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              Nenhum usuário encontrado para essa busca.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">Nome</th>
                    <th className="pb-3 pr-4 font-semibold">Telefone</th>
                    <th className="pb-3 pr-4 font-semibold">Cargo</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {user.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            Usuário do sistema
                          </span>
                        </div>
                      </td>

                      <td className="py-4 pr-4 text-slate-300">
                        {user.phone}
                      </td>

                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
                          {user.role}
                        </span>
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.active
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {user.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Novo CS</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Cadastre um novo responsável para métricas e atendimento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Ex.: Jessica"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Número
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Ex.: 5511999999999"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Cargo
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  >
                    <option value="cs">cs</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar CS"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
  tone?: "default" | "success" | "danger";
}) {
  const toneMap = {
    default: "border-slate-800 bg-slate-900 text-white",
    success: "border-emerald-800 bg-emerald-950/30 text-emerald-200",
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