import {
  isDemoToken,
  loginLocal,
  demoListPostos,
  demoCreatePosto,
  demoDeletePosto,
  demoListRegistros,
  demoListRegistrosAtivos,
  demoCheckin,
  demoCheckout,
  demoFinalizar,
  demoLimparRegistros,
} from "./demo";

// Em dev, deixe vazio para usar o proxy do package.json (→ localhost:8080).
// Em produção, defina REACT_APP_API_URL no .env (ex.: https://sua-api.com).
const API_URL = (process.env.REACT_APP_API_URL || "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\/$/, "");

function apiPath(path) {
  return `${API_URL}${path}`;
}

async function parseError(response, fallback) {
  try {
    const msg = await response.text();
    return msg || fallback;
  } catch {
    return fallback;
  }
}

async function apiFetch(path, options) {
  try {
    return await fetch(apiPath(path), options);
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Inicie o backend Java na porta 8080 e o MySQL (banco 'base')."
    );
  }
}

export async function loginRequest(email, senha) {
  const local = loginLocal(email, senha);
  if (local) return local;

  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha no login"));
  }

  return response.json();
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function listPostosRequest(token) {
  if (isDemoToken(token)) return demoListPostos();

  const response = await apiFetch("/postos", {
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao listar postos"));
  }

  return response.json();
}

export async function createPostoRequest({ nome, descricao }, token) {
  if (isDemoToken(token)) return demoCreatePosto({ nome, descricao });

  const response = await apiFetch("/postos", {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nome, descricao: descricao || "" }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao criar posto"));
  }

  return response.json();
}

export async function deletePostoRequest(id, token) {
  if (isDemoToken(token)) {
    demoDeletePosto(id);
    return;
  }

  const response = await apiFetch(`/postos/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao apagar posto"));
  }
}

export async function checkinRequest({ postoId, fotoFile, token }) {
  if (isDemoToken(token)) return demoCheckin(postoId);

  const formData = new FormData();
  formData.append("postoId", String(postoId));
  formData.append("foto", fotoFile);

  const response = await apiFetch("/check/in", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha no check-in"));
  }

  return response.json();
}

export async function checkoutRequest({ postoId, fotoFile, token }) {
  if (isDemoToken(token)) return demoCheckout(postoId);

  const formData = new FormData();
  formData.append("postoId", String(postoId));
  formData.append("foto", fotoFile);

  const response = await apiFetch("/check/out", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha no check-out"));
  }

  return response.json();
}

export async function listRegistrosAtivosRequest(token) {
  if (isDemoToken(token)) return demoListRegistrosAtivos();

  const response = await apiFetch("/registros/ativos", {
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao carregar registros ativos"));
  }

  return response.json();
}

export async function listRegistrosRequest(token) {
  if (isDemoToken(token)) return demoListRegistros();

  const response = await apiFetch("/registros", {
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao carregar registros"));
  }

  return response.json();
}

export async function finalizarRegistroRequest(id, relatorio, token) {
  if (isDemoToken(token)) return demoFinalizar(id, relatorio);

  const response = await apiFetch(`/registros/${id}/finalizar`, {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prevManha: Number(relatorio.prevManha),
      prevTarde: Number(relatorio.prevTarde),
      vivaManha: Number(relatorio.vivaManha),
      vivaTarde: Number(relatorio.vivaTarde),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao finalizar registro"));
  }

  return response.json();
}

export async function limparRegistrosRequest(token) {
  if (isDemoToken(token)) {
    demoLimparRegistros();
    return;
  }

  const response = await apiFetch("/registros", {
    method: "DELETE",
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Falha ao limpar registros"));
  }
}