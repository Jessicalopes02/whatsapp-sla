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
  const supportUsers = users.filter(
    (user) => user.role === "sales_support"
  ).length;

  function roleLabel(role: string) {
    switch (role) {
      case "cs":
        return "CS";
      case "sales_support":
        return "Sales Support";
      case "manager":
        return "Manager";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  }

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

            <h1 className="text-3xl font-bold text-white">Usuários</h1>

            <p className="mt-2 text-slate-400">
              Gerencie CS e Sales Support do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Novo Usuário
          </button>
        </header>

        {/* 🔥 CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total"
            value={totalUsers}
            hint="Usuários cadastrados"
          />

          <SummaryCard
            title="CS"
            value={csUsers}
            hint="Customer Success"
            tone="success"
          />

          <SummaryCard
            title="Sales Support"
            value={supportUsers}
            hint="Suporte comercial"
            tone="default"
          />

          <SummaryCard
            title="Ativos"
            value={activeUsers}
            hint="Usuários em operação"
            tone="success"
          />
        </section>

        {/* 🔥 LISTA */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Lista de usuários
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Busque por nome, telefone ou cargo.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400">Carregando...</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="pb-3">Nome</th>
                  <th className="pb-3">Telefone</th>
                  <th className="pb-3">Cargo</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800">
                    <td className="py-4 text-white">{user.name}</td>
                    <td className="py-4 text-slate-300">{user.phone}</td>

                    <td className="py-4">
                      <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-300">
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
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
          )}
        </section>

        {/* 🔥 MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg bg-slate-900 p-6 rounded-2xl">
              <h2 className="text-white text-xl mb-4">Novo Usuário</h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <input
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-800 text-white rounded"
                />

                <input
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-800 text-white rounded"
                />

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-800 text-white rounded"
                >
                  <option value="cs">CS</option>
                  <option value="sales_support">Sales Support</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-sky-600 py-3 rounded text-white"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function SummaryCard({ title, value, hint, tone = "default" }: any) {
  return (
    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-white text-xl font-bold">{value}</p>
      <p className="text-slate-500 text-xs">{hint}</p>
    </div>
  );
}