const KEY = "demo_cbm_state_v5";

const POSTOS = [
  { id: 1, nome: "Posto 1", descricao: "Posto 1" },
  { id: 2, nome: "Posto 2", descricao: "Posto 2" },
  { id: 3, nome: "Posto 3", descricao: "Posto 3" },
  { id: 4, nome: "Posto 4", descricao: "Posto 4" },
  { id: 5, nome: "Posto 5", descricao: "Posto 5" },
  { id: 6, nome: "Posto 6", descricao: "Posto 6" },
  { id: 7, nome: "Posto 7", descricao: "Posto 7" },
  { id: 8, nome: "Posto 8", descricao: "Posto 8" },
];

function hoje() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function agora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fotoDemo(hora, preview) {
  return {
    hora: hora || agora(),
    arquivoId: preview || PLACEHOLDER_FOTO,
  };
}

const PLACEHOLDER_FOTO =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAAEAAQMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQID/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0A==";

function estadoInicial() {
  return {
    proximoId: 1,
    postos: POSTOS,
    registros: [],
  };
}

export const CONTA_OPERADOR = {
  email: "salvavida@cbm.com",
  senha: "123456",
  tipo: "OPERADOR",
};

export const CONTA_ADMIN = {
  email: "admin@admin.com",
  senha: "123456789",
  tipo: "ADMIN",
};

export function isDemoToken(token) {
  return typeof token === "string" && token.startsWith("demo-");
}

export function demoLogin(tipo) {
  const papel = tipo === "ADMIN" ? "ADMIN" : "OPERADOR";
  return { token: "demo-" + papel, tipo: papel };
}

export function loginLocal(email, senha) {
  const e = (email || "").trim().toLowerCase();
  const s = senha || "";
  if (e === CONTA_ADMIN.email && s === CONTA_ADMIN.senha) return demoLogin("ADMIN");
  if (e === CONTA_OPERADOR.email && s === CONTA_OPERADOR.senha) return demoLogin("OPERADOR");
  return null;
}

function normalizarEstado(s) {
  if (!s || typeof s !== "object") return estadoInicial();
  // Sempre usa a lista oficial Posto 1–8 no modo demo.
  s.postos = POSTOS;
  if (!Array.isArray(s.registros)) s.registros = [];
  if (!Number.isFinite(s.proximoId) || s.proximoId < 1) s.proximoId = 1;
  return s;
}

export function getDemoState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalizarEstado(JSON.parse(raw));
  } catch {
    /* ignora estado quebrado */
  }
  const s = estadoInicial();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sem storage no aparelho */
  }
  return s;
}

function salvar(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    const leve = {
      ...s,
      registros: (s.registros || []).map((r) => ({
        ...r,
        checkin: (r.checkin || []).map((f) => ({ hora: f.hora, arquivoId: PLACEHOLDER_FOTO })),
        checkout: (r.checkout || []).map((f) => ({ hora: f.hora, arquivoId: PLACEHOLDER_FOTO })),
      })),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(leve));
      Object.assign(s, leve);
    } catch {
      localStorage.removeItem(KEY);
    }
  }
  return s;
}

export function demoListPostos() {
  return getDemoState().postos || POSTOS;
}

export function demoCreatePosto({ nome, descricao }) {
  const s = getDemoState();
  const id = s.postos.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const posto = { id, nome, descricao: descricao || "" };
  s.postos.push(posto);
  salvar(s);
  return posto;
}

export function demoDeletePosto(id) {
  const s = getDemoState();
  s.postos = s.postos.filter((p) => p.id !== Number(id));
  salvar(s);
}

export function demoListRegistros() {
  return getDemoState().registros || [];
}

export function demoListRegistrosAtivos() {
  return (getDemoState().registros || []).filter((r) => r && !r.finalizado);
}

export function demoCheckin(postoId, preview) {
  const s = getDemoState();
  const pid = Number(postoId);
  let ativo = s.registros.find((r) => r.postoId === pid && !r.finalizado);
  const foto = fotoDemo(agora(), preview);

  if (ativo) {
    if ((ativo.checkin || []).length >= 2) {
      throw new Error("Limite de 2 fotos atingido para este registro.");
    }
    ativo.checkin = [...(ativo.checkin || []), foto];
    salvar(s);
    return ativo;
  }

  const id = s.proximoId++;
  const registro = {
    id,
    postoId: pid,
    finalizado: false,
    checkin: [foto],
    checkout: [],
    relatorio: null,
    data: hoje(),
    hora: agora(),
  };
  s.registros.push(registro);
  salvar(s);
  return registro;
}

export function demoCheckout(postoId, preview) {
  const s = getDemoState();
  const pid = Number(postoId);
  const ativo = s.registros.find((r) => r.postoId === pid && !r.finalizado);
  if (!ativo || !(ativo.checkin || []).length) {
    throw new Error("Realize o Check-in antes do Check-Out.");
  }
  if ((ativo.checkout || []).length >= 2) {
    throw new Error("Limite de 2 fotos atingido para este registro.");
  }
  ativo.checkout = [...(ativo.checkout || []), fotoDemo(agora(), preview)];
  salvar(s);
  return ativo;
}

export function demoFinalizar(id, relatorio, postoId) {
  const s = getDemoState();
  const nid = Number(id);
  const np = Number(postoId);
  let r = Number.isFinite(nid)
    ? s.registros.find((x) => x.id === nid)
    : null;
  if (!r && Number.isFinite(np)) {
    r = s.registros.find((x) => x.postoId === np && !x.finalizado);
  }
  if (!r) {
    throw new Error("Registro não encontrado. Faça o check-in de novo.");
  }
  r.finalizado = true;
  r.relatorio = {
    prevManha: Number(relatorio?.prevManha) || 0,
    prevTarde: Number(relatorio?.prevTarde) || 0,
    vivaManha: Number(relatorio?.vivaManha) || 0,
    vivaTarde: Number(relatorio?.vivaTarde) || 0,
  };
  salvar(s);
  return { ...r, checkin: r.checkin || [], checkout: r.checkout || [] };
}

export function demoLimparRegistros() {
  const s = getDemoState();
  s.registros = [];
  salvar(s);
}
