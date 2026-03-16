"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projetos", href: "/projects" },
  { label: "CS", href: "/users" },
  { label: "Histórico", href: "/history" },
  { label: "Configurações", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 lg:block">
      <div className="flex h-full flex-col px-5 py-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Operação CS
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            SLA WhatsApp
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Monitoramento de atendimento e atrasos.
          </p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Painel em tempo real com atualização automática.
          </p>
        </div>
      </div>
    </aside>
  );
}