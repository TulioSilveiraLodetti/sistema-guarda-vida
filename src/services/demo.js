const KEY = "demo_cbm_state";

const POSTOS = [
  { id: 1, nome: "Posto Central", descricao: "Torre principal da praia" },
  { id: 2, nome: "Posto Norte", descricao: "Trecho das pedras" },
  { id: 3, nome: "Posto Sul", descricao: "Quiosque 4" },
  { id: 4, nome: "Posto Molhe", descricao: "Saída do rio" },
  { id: 5, nome: "Posto Camping", descricao: "Área de camping" },
  { id: 6, nome: "Posto Farol", descricao: "Em frente ao farol" },
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

function estadoInicial() {
  return {
    proximoId: 4,
    postos: POSTOS,
    registros: [
      {
        id: 1,
        postoId: 1,
        finalizado: false,
        checkin: [{ hora: "08:12" }],
        checkout: [],
        relatorio: null,
        data: hoje(),
        hora: "08:12",
      },
      {
        id: 2,
        postoId: 2,
        finalizado: true,
        checkin: [{ hora: "07:40" }],
        checkout: [{ hora: "16:05" }],
        relatorio: { prevManha: 2, prevTarde: 1, vivaManha: 1, vivaTarde: 0 },
        data: hoje(),
        hora: "07:40",
      },
      {
        id: 3,
        postoId: 3,
        finalizado: true,
        checkin: [{ hora: "08:00" }],
        checkout: [{ hora: "15:50" }],
        relatorio: { prevManha: 0, prevTarde: 1, vivaManha: 0, vivaTarde: 1 },
        data: hoje(),
        hora: "08:00",
      },
    ],
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

export function getDemoState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignora estado quebrado */
  }
  const s = estadoInicial();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

function salvar(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function demoListPostos() {
  return getDemoState().postos;
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
  return getDemoState().registros;
}

export function demoListRegistrosAtivos() {
  return getDemoState().registros.filter((r) => !r.finalizado);
}

export function demoCheckin(postoId) {
  const s = getDemoState();
  const id = s.proximoId++;
  const registro = {
    id,
    postoId: Number(postoId),
    finalizado: false,
    checkin: [{ hora: agora() }],
    checkout: [],
    relatorio: null,
    data: hoje(),
    hora: agora(),
  };
  s.registros.push(registro);
  salvar(s);
  return registro;
}

export function demoCheckout(postoId) {
  const s = getDemoState();
  const ativo = s.registros.find((r) => r.postoId === Number(postoId) && !r.finalizado);
  if (ativo) ativo.checkout = [{ hora: agora() }];
  salvar(s);
  return ativo || {};
}

export function demoFinalizar(id, relatorio) {
  const s = getDemoState();
  const r = s.registros.find((x) => x.id === Number(id));
  if (r) {
    r.finalizado = true;
    r.relatorio = relatorio;
  }
  salvar(s);
  return r || {};
}

export function demoLimparRegistros() {
  const s = getDemoState();
  s.registros = [];
  salvar(s);
}
