import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginRequest } from "../services/api";
import { saveAuth } from "../services/auth";
import { CONTA_ADMIN, CONTA_OPERADOR } from "../services/demo";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const perfil = searchParams.get("perfil");

  const inicial = useMemo(() => {
    if (perfil === "admin") return CONTA_ADMIN;
    if (perfil === "usuario") return CONTA_OPERADOR;
    return { email: "", senha: "" };
  }, [perfil]);

  const [usuario, setUsuario] = useState(inicial.email);
  const [senha, setSenha] = useState(inicial.senha);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const entrar = async (email, senhaLogin) => {
    setErro("");
    try {
      setCarregando(true);
      const data = await loginRequest(email, senhaLogin);
      saveAuth(data.token, data.tipo);
      navigate(data.tipo === "ADMIN" ? "/dashboardAdmin" : "/dashboard");
    } catch (error) {
      const msg =
        error?.message === "Failed to fetch"
          ? "Não foi possível conectar ao servidor. Verifique se o backend (porta 8080) e o MySQL estão rodando."
          : error?.message || "Credenciais inválidas";
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  };

  const lidarComLogin = async (e) => {
    e.preventDefault();
    await entrar(usuario, senha);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-700 via-blue-800 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-10 border-b-8 border-red-600">
        <button
          onClick={() => navigate("/")}
          className="text-red-600 mb-6 font-bold flex items-center gap-2 hover:underline"
        >
          ← Voltar para Início
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center uppercase tracking-tighter">
          Acesso ao Sistema
        </h2>
        <p className="text-gray-500 mb-6 text-sm text-center font-medium">
          Entre com o login de usuário ou de administrador.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => {
              setUsuario(CONTA_OPERADOR.email);
              setSenha(CONTA_OPERADOR.senha);
              setErro("");
            }}
            className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-red-500 bg-slate-50"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Usuário</p>
            <p className="font-bold text-gray-800 text-sm mt-1">{CONTA_OPERADOR.email}</p>
            <p className="text-xs text-gray-500 mt-1">senha {CONTA_OPERADOR.senha}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setUsuario(CONTA_ADMIN.email);
              setSenha(CONTA_ADMIN.senha);
              setErro("");
            }}
            className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-red-500 bg-slate-50"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</p>
            <p className="font-bold text-gray-800 text-sm mt-1">{CONTA_ADMIN.email}</p>
            <p className="text-xs text-gray-500 mt-1">senha {CONTA_ADMIN.senha}</p>
          </button>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium text-center"
          >
            {erro}
          </div>
        )}

        <form className="space-y-5" onSubmit={lidarComLogin} autoComplete="off">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">
              Email
            </label>
            <input
              type="email"
              name="cbm-email"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="off"
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">
              Senha
            </label>
            <input
              type="password"
              name="cbm-senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 mt-2 active:scale-95 uppercase tracking-widest disabled:opacity-60"
          >
            {carregando ? "ENTRANDO..." : "ENTRAR NO SISTEMA"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
