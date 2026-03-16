"use client";

import { AppShell } from "../../components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="min-h-screen bg-slate-950 px-6 py-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-400">Sistema</p>

          <h1 className="text-3xl font-bold text-white">Configurações</h1>

          <p className="mt-2 text-slate-400">
            Ajustes gerais da operação, SLA e integração.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-white">
              Operação
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nome da operação
                </label>
                <input
                  type="text"
                  defaultValue="CS WhatsApp"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  SLA padrão (minutos)
                </label>
                <input
                  type="number"
                  defaultValue={15}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Intervalo de atualização do painel (segundos)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                Configuração visual pronta. Depois podemos salvar isso no banco.
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-white">
              Integração
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Status atual
                </label>

                <div className="rounded-2xl border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
                  Integração ainda não conectada.
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  URL do webhook
                </label>
                <input
                  type="text"
                  placeholder="https://seu-sistema.com/webhook/timeline"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Token da integração
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="rounded-2xl border border-sky-800 bg-sky-950/30 px-4 py-3 text-sm text-sky-300">
                Essa área será usada quando conectarmos o TimelineAI.
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Alertas e comportamento
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium text-slate-300">
                Notificação privada
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Enviar alerta ao responsável no privado quando o SLA estourar.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium text-slate-300">
                Atualização automática
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Recarregar o dashboard automaticamente em intervalos definidos.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium text-slate-300">
                Escalonamento futuro
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Preparado para escalar atraso para líder ou gestor depois.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}