const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

type DashboardFilters = {
  period?: string;
  userId?: string;
  sectorId?: string;
  status?: string;
};

function buildQuery(filters?: DashboardFilters) {
  const params = new URLSearchParams();

  if (filters?.period && filters.period !== "all") {
    params.set("period", filters.period);
  }

  if (filters?.userId) {
    params.set("userId", filters.userId);
  }

  if (filters?.sectorId) {
    params.set("sectorId", filters.sectorId);
  }

  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getSummary(filters?: DashboardFilters) {
  const res = await fetch(`${API}/dashboard/summary${buildQuery(filters)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao buscar summary");
  return res.json();
}

export async function getUsers(filters?: DashboardFilters) {
  const res = await fetch(`${API}/dashboard/by-user${buildQuery(filters)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao buscar usuários");
  return res.json();
}

export async function getDelays(filters?: DashboardFilters) {
  const res = await fetch(`${API}/dashboard/open-delays${buildQuery(filters)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao buscar atrasos");
  return res.json();
}

export async function getOpenTickets(filters?: DashboardFilters) {
  const res = await fetch(`${API}/dashboard/open-tickets${buildQuery(filters)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao buscar tickets abertos");
  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${API}/projects`, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    console.error("Erro /projects:", res.status, text);
    throw new Error(`Erro ao buscar projetos: ${res.status} - ${text}`);
  }

  return res.json();
}

export async function getUsersList() {
  const res = await fetch(`${API}/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao buscar lista de usuários");
  return res.json();
}

export async function getHistory(filters?: DashboardFilters) {
  const res = await fetch(`${API}/dashboard/history${buildQuery(filters)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
}

export async function createUser(data: {
  name: string;
  phone: string;
  role: string;
}) {
  const res = await fetch(`${API}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erro ao criar usuário");
  return res.json();
}

export async function getDebugNotifications() {
  const res = await fetch(`${API}/debug/notifications`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Erro ao buscar notificações de debug");
  return res.json();
}

export async function getFailedDebugNotifications() {
  const res = await fetch(`${API}/debug/notifications/failed`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Erro ao buscar falhas de notificações");
  return res.json();
}