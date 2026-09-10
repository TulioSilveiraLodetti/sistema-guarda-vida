const TOKEN_KEY = "token_cbm";
const ROLE_KEY = "role_cbm";

export function saveAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getDashboardPath(role) {
  return role === "ADMIN" ? "/dashboardAdmin" : "/dashboard";
}

export function isDemo() {
  const t = getToken();
  return typeof t === "string" && t.startsWith("demo-");
}