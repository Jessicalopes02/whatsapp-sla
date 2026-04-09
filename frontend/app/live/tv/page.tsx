"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveTicketsBoard } from "../../../components/LiveTicketsBoard";
import { useAutoRefresh } from "../../../components/useAutoRefresh";
import { getDelays, getOpenTickets } from "../../../services/api";

type LiveBoardItem = {
  id: string;
  projectId: string;
  projectName: string;
  groupName: string;
  responsibleName: string;
  responsiblePhone: string;
  openedAt: string;
  deadlineAt: string;
  displayMinutes: number;
  badgeLabel: string;
  minutesToDeadline: number;
  isNearDeadline: boolean;
  isOverdue: boolean;
};

export default function LiveTvPage() {
  useAutoRefresh(30000);

  const [openTickets, setOpenTickets] = useState<any[]>([]);
  const [delays, setDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLive() {
      try {
        setLoading(true);

        const [openData, overdueData] = await Promise.all([
          getOpenTickets(),
          getDelays(),
        ]);

        setOpenTickets(openData);
        setDelays(overdueData);
      } catch (error) {
        console.error("Erro ao carregar modo TV", error);
      } finally {
        setLoading(false);
      }
    }

    loadLive();
  }, []);

  const totalOpen = openTickets.length;
  const totalOverdue = delays.length;

  const mergedLiveItems: LiveBoardItem[] = useMemo(() => {
    const openMapped: LiveBoardItem[] = openTickets.map((item: any) => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
      groupName: item.groupName,
      responsibleName: item.responsibleName,
      responsiblePhone: item.responsiblePhone,
      openedAt: item.openedAt,
      deadlineAt: item.deadlineAt,
      displayMinutes: item.waitingMinutes,
      badgeLabel: "aguardando há",
      minutesToDeadline: item.minutesToDeadline,
      isNearDeadline: item.isNearDeadline,
      isOverdue: false,
    }));

    const overdueMapped: LiveBoardItem[] = delays.map((item: any) => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
      groupName: item.groupName,
      responsibleName: item.responsibleName,
      responsiblePhone: item.responsiblePhone,
      openedAt: item.openedAt,
      deadlineAt: item.deadlineAt,
      displayMinutes: item.delayMinutes,
      badgeLabel: "em atraso há",
      minutesToDeadline: -Math.abs(item.delayMinutes),
      isNearDeadline: false,
      isOverdue: true,
    }));

    const all = [...overdueMapped, ...openMapped];

    return all.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      return b.displayMinutes - a.displayMinutes;
    });
  }, [openTickets, delays]);

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-8">
      <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-base font-medium text-slate-400">Modo TV</p>
          <h1 className="text-5xl font-bold text-white">Painel LIVE</h1>
          <p className="mt-3 text-lg text-slate-400">
            Central visual de acompanhamento dos atendimentos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <TvCard title="Abertos" value={totalOpen} tone="info" />
          <TvCard title="Atrasados" value={totalOverdue} tone="danger" />
          <TvCard
            title="Monitorados"
            value={mergedLiveItems.length}
            tone="default"
          />
          <TvCard title="Refresh" value="30s" tone="success" />
        </div>
      </header>

      {totalOverdue > 0 && (
        <section className="mb-8 rounded-3xl border border-rose-600 bg-rose-950/50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-2xl font-bold text-rose-200">
                Atenção: existem {totalOverdue} tickets com SLA vencido
              </p>
              <p className="mt-1 text-sm text-rose-300/80">
                Priorize imediatamente os cards destacados em vermelho.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/50 bg-rose-900/40 px-5 py-3 text-sm font-semibold text-rose-100">
              Operação crítica
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">
            Fila de atendimento
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Os cards mais críticos aparecem primeiro.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-slate-400">
            Carregando modo TV...
          </div>
        ) : (
          <LiveTicketsBoard items={mergedLiveItems} />
        )}
      </section>
    </main>
  );
}

function TvCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string | number;
  tone?: "default" | "success" | "danger" | "info";
}) {
  const toneMap = {
    default: "border-slate-800 bg-slate-900 text-white",
    success: "border-emerald-700 bg-emerald-950/30 text-emerald-200",
    danger: "border-rose-700 bg-rose-950/30 text-rose-200",
    info: "border-sky-700 bg-sky-950/30 text-sky-200",
  };

  return (
    <div className={`min-w-[180px] rounded-3xl border p-5 ${toneMap[tone]}`}>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight">{value}</p>
    </div>
  );
}