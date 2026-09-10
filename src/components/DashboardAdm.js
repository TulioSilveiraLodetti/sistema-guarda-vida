import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { createPostoRequest, deletePostoRequest, listPostosRequest, listRegistrosRequest, limparRegistrosRequest } from "../services/api";
import { clearAuth, getToken, isDemo } from "../services/auth";
import FotoApi from "./FotoApi";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [relatorios, setRelatorios] = useState([]);
  const [statusPostos, setStatusPostos] = useState({});
  const [postos, setPostos] = useState([]);
  const [postoSelecionado, setPostoSelecionado] = useState(null);
  const [mostrarTodosHistorico, setMostrarTodosHistorico] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("monitoramento");
  const [nomeNovoPosto, setNomeNovoPosto] = useState("");
  const [descNovoPosto, setDescNovoPosto] = useState("");
  const [carregandoPostos, setCarregandoPostos] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const registroRefs = useRef({});

  useEffect(() => {
    if (!fotoAmpliada) return;
    const fecharComEsc = (e) => {
      if (e.key === "Escape") setFotoAmpliada(null);
    };
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [fotoAmpliada]);

  const carregarDados = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const todos = await listRegistrosRequest(token);
      const finalizados = todos
        .filter((r) => r.finalizado)
        .map((r) => ({
          id: r.id,
          posto: r.postoId,
          checkin: r.checkin || [],
          checkout: r.checkout || [],
          relatorio: r.relatorio,
          data: r.data,
          hora: r.hora,
        }));

      const ativosMap = {};
      todos
        .filter((r) => !r.finalizado)
        .forEach((r) => {
          ativosMap[r.postoId] = {
            registroId: r.id,
            checkin: r.checkin || [],
            checkout: r.checkout || [],
            relatorio: r.relatorio || null,
            data: r.data,
            hora: r.hora,
          };
        });

      setRelatorios(finalizados);
      setStatusPostos(ativosMap);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const carregarPostosApi = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setCarregandoPostos(true);
    try {
      const lista = await listPostosRequest(token);
      const ordenados = [...lista].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
      );
      setPostos(ordenados);
    } catch (err) {
      alert(err.message);
    } finally {
      setCarregandoPostos(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
    carregarPostosApi();
    const intervalo = setInterval(carregarDados, 30000);
    return () => clearInterval(intervalo);
  }, [carregarDados, carregarPostosApi]);

  const relatorioDoPosto = (id) =>
    relatorios.find((r) => Number(r.posto) === Number(id));

  const dadosPosto = (id) => {
    const aoVivo = statusPostos[id] || { checkin: [], checkout: [] };
    const salvo = relatorioDoPosto(id);
    return {
      checkin: aoVivo.checkin?.length ? aoVivo.checkin : salvo?.checkin || [],
      checkout: aoVivo.checkout?.length ? aoVivo.checkout : salvo?.checkout || [],
      relatorio: aoVivo.relatorio || salvo?.relatorio || null,
      data: salvo?.data,
      hora: salvo?.hora,
    };
  };

  const statusCorPosto = (id) => {
    const d = dadosPosto(id);
    const temCheckin = (d.checkin || []).length > 0;
    const checkoutFeito = !!d.relatorio;
    if (temCheckin && checkoutFeito) return "completo";
    if (temCheckin || (d.checkout || []).length > 0) return "andamento";
    return "vazio";
  };

  const ampliarFoto = (foto, legenda) => (e) => {
    e.stopPropagation();
    setFotoAmpliada({
      arquivoId: foto.arquivoId,
      hora: foto.hora,
      legenda,
    });
  };

  const estiloCardPosto = (status) => {
    if (status === "completo") {
      return {
        card: "border-green-500 bg-green-950/30",
        header: "bg-green-700",
        checkin: "bg-green-600/30 text-green-300",
        checkout: "bg-green-600/30 text-green-300",
        rodape: "text-green-400",
        textoRodape: "Concluído",
      };
    }
    if (status === "andamento") {
      return {
        card: "border-yellow-500 bg-yellow-950/20",
        header: "bg-yellow-600 text-yellow-950",
        checkin: "bg-yellow-500/25 text-yellow-300",
        checkout: "bg-yellow-500/25 text-yellow-300",
        rodape: "text-yellow-400",
        textoRodape: "Em andamento",
      };
    }
    return {
      card: "border-gray-700",
      header: "bg-gray-700",
      checkin: "text-gray-500",
      checkout: "text-gray-500",
      rodape: "text-gray-500",
      textoRodape: "Aguardando",
    };
  };

  const postosOrdenados = () =>
    [...postos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));

  const postosNoHistorico = () => {
    if (mostrarTodosHistorico) return postosOrdenados();

    if (postoSelecionado) {
      const posto = postos.find((p) => p.id === postoSelecionado);
      return posto ? [posto] : [];
    }

    return [];
  };

  const selecionarPosto = (id) => {
    setMostrarTodosHistorico(false);
    setPostoSelecionado(id);
    setTimeout(() => {
      registroRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const verTodosPostos = () => {
    setPostoSelecionado(null);
    setMostrarTodosHistorico(true);
    setTimeout(() => {
      document.getElementById("historico-registros")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  useEffect(() => {
    if (postoSelecionado && registroRefs.current[postoSelecionado]) {
      registroRefs.current[postoSelecionado].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [postoSelecionado, relatorios, statusPostos]);

  const apagarPosto = async (posto) => {
    if (
      !window.confirm(
        `Apagar o posto "${posto.nome}" e todos os registros locais dele? Esta acao nao pode ser desfeita.`
      )
    ) {
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Sessao expirada. Faca login novamente.");
      navigate("/login");
      return;
    }

    try {
      await deletePostoRequest(posto.id, token);
      await carregarDados();
      await carregarPostosApi();
      if (postoSelecionado === posto.id) setPostoSelecionado(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const adicionarPosto = async (e) => {
    e.preventDefault();
    if (!nomeNovoPosto.trim()) {
      alert("Informe o nome do posto.");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Sessao expirada. Faca login novamente.");
      navigate("/login");
      return;
    }

    try {
      await createPostoRequest(
        { nome: nomeNovoPosto.trim(), descricao: descNovoPosto.trim() },
        token
      );
      setNomeNovoPosto("");
      setDescNovoPosto("");
      await carregarPostosApi();
      setAbaAtiva("monitoramento");
    } catch (err) {
      alert(err.message);
    }
  };

  const exportarXLSX = async () => {
    if (relatorios.length === 0) {
      alert("Nao ha registros para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatorio CBM");

    sheet.columns = [
      { header: "Posto", key: "posto", width: 10 },
      { header: "Data", key: "data", width: 14 },
      { header: "Hora", key: "hora", width: 12 },
      { header: "Prevencoes Manha", key: "prevM", width: 18 },
      { header: "Prevencoes Tarde", key: "prevT", width: 18 },
      { header: "Prevencoes Total", key: "prevTotal", width: 18 },
      { header: "Agua-Viva Manha", key: "vivaM", width: 16 },
      { header: "Agua-Viva Tarde", key: "vivaT", width: 16 },
      { header: "Agua-Viva Total", key: "vivaTotal", width: 16 },
      { header: "Fotos Check-in", key: "fotosIn", width: 14 },
      { header: "Fotos Check-out", key: "fotosOut", width: 15 },
    ];

    relatorios.forEach((item) => {
      const prevM = Number(item.relatorio?.prevManha ?? 0);
      const prevT = Number(item.relatorio?.prevTarde ?? 0);
      const vivaM = Number(item.relatorio?.vivaManha ?? 0);
      const vivaT = Number(item.relatorio?.vivaTarde ?? 0);

      sheet.addRow({
        posto: item.posto ?? "",
        data: item.data ?? "",
        hora: item.hora ?? "",
        prevM,
        prevT,
        prevTotal: prevM + prevT,
        vivaM,
        vivaT,
        vivaTotal: vivaM + vivaT,
        fotosIn: (item.checkin || []).length,
        fotosOut: (item.checkout || []).length,
      });
    });

    const header = sheet.getRow(1);
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFDDDDDD" } },
            left: { style: "thin", color: { argb: "FFDDDDDD" } },
            bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
            right: { style: "thin", color: { argb: "FFDDDDDD" } },
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Relatorio_CBM_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`);
  };

  const limparLogs = async () => {
    if (!window.confirm("ATENCAO: Deseja apagar todos os registros do sistema? Esta acao nao pode ser desfeita.")) {
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Sessao expirada. Faca login novamente.");
      navigate("/login");
      return;
    }

    try {
      await limparRegistrosRequest(token);
      setRelatorios([]);
      setStatusPostos({});
      setPostoSelecionado(null);
      setMostrarTodosHistorico(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <header className="bg-gray-900 p-6 border-b-4 border-blue-600 sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl">
        <div>
          <h1 className="font-black italic text-2xl tracking-tighter text-blue-500 uppercase">Admin Painel</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Central de Comando
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setAbaAtiva("monitoramento")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${
              abaAtiva === "monitoramento"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-800 border-gray-600 text-gray-400"
            }`}
          >
            Monitoramento
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("gestao")}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${
              abaAtiva === "gestao"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-800 border-gray-600 text-gray-400"
            }`}
          >
            Gestão de Postos
          </button>
          <button
            type="button"
            onClick={exportarXLSX}
            className="bg-green-600/20 text-green-500 border border-green-500 px-4 py-2 rounded-lg text-[10px] font-black hover:bg-green-600 hover:text-white transition-all shadow-lg uppercase"
          >
            Exportar em planilha
          </button>
          <button
            type="button"
            onClick={limparLogs}
            className="bg-red-900/20 text-red-500 border border-red-500 px-4 py-2 rounded-lg text-[10px] font-black hover:bg-red-500 hover:text-white transition-all uppercase"
          >
            Limpar Tudo
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
            className="bg-white text-black px-6 py-2 rounded-lg text-xs font-black uppercase shadow-lg active:scale-95"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {isDemo() && (
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-900/40 border border-amber-600 rounded-xl py-2">
            Modo demonstração — dados de exemplo
          </p>
        )}
        {abaAtiva === "gestao" && (
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl mb-12">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-400">
              Adicionar Posto
            </h2>
            <form onSubmit={adicionarPosto} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <input
                type="text"
                placeholder="Nome do posto (ex: POSTO 22)"
                value={nomeNovoPosto}
                onChange={(e) => setNomeNovoPosto(e.target.value)}
                className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={descNovoPosto}
                onChange={(e) => setDescNovoPosto(e.target.value)}
                className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-sm"
              />
              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700"
              >
                Cadastrar Posto
              </button>
            </form>

            <h3 className="text-sm font-black uppercase text-gray-500 mb-4 tracking-widest">
              Postos cadastrados
            </h3>
            {carregandoPostos ? (
              <p className="text-gray-500 text-sm">Carregando postos...</p>
            ) : postos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum posto no servidor.</p>
            ) : (
              <div className="space-y-3">
                {postos.map((posto) => (
                  <div
                    key={posto.id}
                    className="flex flex-wrap justify-between items-center gap-3 bg-gray-800 p-4 rounded-xl border border-gray-700"
                  >
                    <div>
                      <p className="font-black uppercase">{posto.nome}</p>
                      {posto.descricao && (
                        <p className="text-xs text-gray-500 mt-1">{posto.descricao}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => apagarPosto(posto)}
                      className="bg-red-900/30 text-red-400 border border-red-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 hover:text-white"
                    >
                      Apagar Posto
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === "monitoramento" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 max-w-6xl mx-auto">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center sm:text-left w-full sm:w-auto">
                Postos <span className="text-blue-600">da Praia</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={verTodosPostos}
                  className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase border tracking-widest shadow-md ${
                    mostrarTodosHistorico
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-200 hover:border-blue-500 hover:text-white"
                  }`}
                >
                  Ver todos os postos
                </button>
                <div className="flex gap-3 text-[9px] font-bold uppercase">
                  <span className="flex items-center gap-1 text-gray-500">
                    <span className="w-3 h-3 rounded bg-gray-700 border border-gray-600"></span> Sem registro
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <span className="w-3 h-3 rounded bg-yellow-500"></span> Em andamento
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="w-3 h-3 rounded bg-green-600"></span> Concluído
                  </span>
                </div>
              </div>
            </div>

            {carregandoPostos && postos.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Carregando postos...</p>
            ) : postos.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Nenhum posto cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12 justify-items-center max-w-6xl mx-auto">
                {postos.map((posto) => {
                  const id = posto.id;
                  const dados = dadosPosto(id);
                  const status = statusCorPosto(id);
                  const ativo = postoSelecionado === id;
                  const estilo = estiloCardPosto(status);

                  return (
                    <div
                      key={id}
                      className={`w-full max-w-xs bg-gray-800 rounded-2xl overflow-hidden border-2 shadow-lg transition-all cursor-pointer ${estilo.card} ${
                        ativo ? "ring-4 ring-blue-500 scale-[1.02]" : "hover:scale-[1.01]"
                      }`}
                      onClick={() => selecionarPosto(id)}
                      onKeyDown={(e) => e.key === "Enter" && selecionarPosto(id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className={`w-full p-4 text-center font-black italic text-2xl sm:text-3xl ${estilo.header}`}
                      >
                        {posto.nome}
                      </div>
                      <div className="flex flex-col border-t border-gray-700/50">
                        <div
                          className={`p-4 font-bold text-sm border-b border-gray-700/50 text-center ${estilo.checkin}`}
                        >
                          CHECK-IN{" "}
                          {dados.checkin.length > 0 && `(${dados.checkin.length}/2)`}
                        </div>
                        <div className={`p-4 font-bold text-sm text-center ${estilo.checkout}`}>
                          CHECK-OUT{" "}
                          {dados.checkout.length > 0 && `(${dados.checkout.length}/2)`}
                        </div>
                      </div>
                      <p
                        className={`p-2 text-center text-[10px] font-bold uppercase tracking-widest ${estilo.rodape}`}
                      >
                        {estilo.textoRodape}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              id="historico-registros"
              className="mt-12 max-w-xl mr-auto ml-0 bg-gray-800 rounded-2xl p-5 sm:p-6 border-t-4 border-blue-600 shadow-2xl"
            >
              <h3 className="text-xl font-black mb-4 uppercase text-blue-400 italic flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Historico de Registros (Fotos)
              </h3>
              {postoSelecionado && !mostrarTodosHistorico && (
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-4">
                  Exibindo apenas o posto selecionado
                </p>
              )}
              {mostrarTodosHistorico && (
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4">
                  Todos os postos em ordem numerica
                </p>
              )}
              {postosNoHistorico().length === 0 ? (
                <p className="text-center text-gray-500 text-sm uppercase font-bold tracking-widest py-8">
                  Clique em um posto acima ou em &quot;Ver todos os postos&quot;.
                </p>
              ) : (
                <div className="space-y-5">
                  {postosNoHistorico().map((posto) => {
                    const info = dadosPosto(posto.id);
                    const concluido = statusCorPosto(posto.id) === "completo";
                    const destacado = !mostrarTodosHistorico && postoSelecionado === posto.id;
                    const prevM = Number(info.relatorio?.prevManha ?? 0);
                    const prevT = Number(info.relatorio?.prevTarde ?? 0);
                    const vivaM = Number(info.relatorio?.vivaManha ?? 0);
                    const vivaT = Number(info.relatorio?.vivaTarde ?? 0);

                    return (
                      <div
                        key={posto.id}
                        ref={(el) => {
                          registroRefs.current[posto.id] = el;
                        }}
                        className={`bg-gray-900 rounded-xl p-4 shadow-md transition-all ${
                          concluido ? "border-l-4 border-green-600" : "border-l-4 border-yellow-500"
                        } ${destacado ? "ring-2 ring-blue-500" : ""}`}
                      >
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                          <h4 className="font-black text-lg text-white italic underline">
                            {posto.nome}
                          </h4>
                          {info.data && (
                            <div className="text-right text-[10px] font-mono text-gray-400">
                              <p className="font-bold text-white text-xs">{info.data}</p>
                              <p className="text-blue-500">{info.hora}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-start gap-5 sm:gap-6 mb-3">
                          <div>
                            <p className="text-[10px] font-black text-green-500 mb-1.5 tracking-widest uppercase">
                              Check-in (Entrada)
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {(info.checkin || []).length === 0 ? (
                                <p className="text-xs text-gray-500">Sem foto</p>
                              ) : (
                                (info.checkin || []).map((f, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1">
                                    <div className="w-[5.5rem] h-[5.5rem] bg-gray-800 border-2 border-green-500 rounded-lg overflow-hidden">
                                      <FotoApi
                                        arquivoId={f.arquivoId}
                                        className="w-full h-full object-cover object-center contrast-[1.08] cursor-pointer hover:opacity-90 transition-opacity"
                                        alt="entrada"
                                        onClick={ampliarFoto(f, "Check-in (Entrada)")}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="text-[10px] font-mono text-gray-300 underline"
                                      onClick={ampliarFoto(f, "Check-in (Entrada)")}
                                    >
                                      {f.hora}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <p
                              className={`text-[10px] font-black mb-1.5 tracking-widest uppercase ${
                                concluido ? "text-green-500" : "text-yellow-500"
                              }`}
                            >
                              Check-out (Saida)
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {(info.checkout || []).length === 0 ? (
                                <p className="text-xs text-gray-500">Sem foto</p>
                              ) : (
                                (info.checkout || []).map((f, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1">
                                    <div
                                      className={`w-[5.5rem] h-[5.5rem] bg-gray-800 border-2 rounded-lg overflow-hidden ${
                                        concluido ? "border-green-500" : "border-yellow-500"
                                      }`}
                                    >
                                      <FotoApi
                                        arquivoId={f.arquivoId}
                                        className="w-full h-full object-cover object-center contrast-[1.08] cursor-pointer hover:opacity-90 transition-opacity"
                                        alt="saida"
                                        onClick={ampliarFoto(f, "Check-out (Saída)")}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="text-[10px] font-mono text-gray-300 underline"
                                      onClick={ampliarFoto(f, "Check-out (Saída)")}
                                    >
                                      {f.hora}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {info.relatorio ? (
                          <div className="bg-black/50 rounded-xl p-3.5 border border-gray-700 w-full">
                            <p className="text-gray-500 font-black text-[10px] uppercase mb-2 tracking-widest text-center border-b border-gray-800 pb-1.5">
                              Prevenções da Missão
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center">
                                <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Prevenções</p>
                                <div className="text-sm font-bold bg-gray-800 py-1.5 rounded-lg border border-gray-700 mb-1">
                                  M: {info.relatorio.prevManha ?? 0} | T: {info.relatorio.prevTarde ?? 0}
                                </div>
                                <p className="text-[9px] text-gray-500 font-black uppercase">Total</p>
                                <div className="text-base font-black text-blue-400 bg-gray-800 py-1.5 rounded-lg border border-blue-900">
                                  {prevM + prevT}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Água-Viva</p>
                                <div className="text-sm font-bold bg-gray-800 py-1.5 rounded-lg border border-gray-700 mb-1">
                                  M: {info.relatorio.vivaManha ?? 0} | T: {info.relatorio.vivaTarde ?? 0}
                                </div>
                                <p className="text-[9px] text-gray-500 font-black uppercase">Total</p>
                                <div className="text-base font-black text-red-400 bg-gray-800 py-1.5 rounded-lg border border-red-900">
                                  {vivaM + vivaT}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                            Aguardando check-out com prevenções enviadas.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] cursor-pointer"
          onClick={() => setFotoAmpliada(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFotoAmpliada(null);
            }}
            className="fixed top-5 right-5 z-[101] text-white text-sm font-bold hover:text-red-400 uppercase tracking-widest bg-black/60 px-4 py-2 rounded-lg border border-white/20"
          >
            Fechar ✕
          </button>
          <div
            className="flex flex-col items-center max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <FotoApi
              arquivoId={fotoAmpliada.arquivoId}
              className="max-w-full max-h-[80vh] object-contain rounded-xl border-2 border-blue-600 shadow-2xl"
              alt="Foto ampliada"
            />
            <p className="text-white mt-3 text-sm font-bold">{fotoAmpliada.legenda}</p>
            {fotoAmpliada.hora && (
              <p className="text-blue-400 text-xs font-mono mt-1">{fotoAmpliada.hora}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
