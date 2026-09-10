import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkinRequest,
  checkoutRequest,
  listPostosRequest,
  listRegistrosAtivosRequest,
  listRegistrosRequest,
  finalizarRegistroRequest,
} from "../services/api";
import { clearAuth, getToken, isDemo } from "../services/auth";
import FotoApi from "./FotoApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [statusPostos, setStatusPostos] = useState({});
  const statusPostosRef = useRef({});
  const [historico, setHistorico] = useState([]);
  const historicoRef = useRef([]);
  const [modal, setModal] = useState({ aberto: false, tipo: "", postoId: null });
  const [stream, setStream] = useState(null);

  const [dadosRelatorio, setDadosRelatorio] = useState({
    prevManha: "",
    prevTarde: "",
    vivaManha: "",
    vivaTarde: "",
  });

  const [postos, setPostos] = useState([]);

  const mapRegistroToStatus = (registro) => ({
    registroId: registro.id,
    checkin: registro.checkin || [],
    checkout: registro.checkout || [],
    relatorio: registro.relatorio || null,
  });

  const carregarRegistros = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [ativos, todos] = await Promise.all([
        listRegistrosAtivosRequest(token),
        listRegistrosRequest(token),
      ]);

      const map = {};
      ativos.forEach((r) => {
        map[r.postoId] = mapRegistroToStatus(r);
      });
      statusPostosRef.current = map;
      setStatusPostos(map);

      const finalizados = todos.filter((r) => r.finalizado);
      historicoRef.current = finalizados;
      setHistorico(finalizados);
    } catch {
      /* mantém estado atual se API falhar */
    }
  }, []);

  const dadosExibicaoPosto = (id) => {
    if (statusPostos[id]) return statusPostos[id];
    const ultimo = historico.find((r) => Number(r.postoId) === Number(id));
    return ultimo ? mapRegistroToStatus(ultimo) : { checkin: [], checkout: [] };
  };

  const nomePosto = (id) => postos.find((p) => p.id === Number(id))?.nome || `POSTO ${id}`;

  useEffect(() => {
    carregarRegistros();

    const token = getToken();
    if (!token) return;

    listPostosRequest(token)
      .then((lista) => {
        const ordenados = [...lista].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
        );
        setPostos(ordenados);
      })
      .catch(() => {
        setPostos(Array.from({ length: 21 }, (_, i) => ({ id: i + 1, nome: `POSTO ${i + 1}` })));
      });
  }, [carregarRegistros]);

  const dataUrlToFile = (dataUrl, fileName = "foto.jpg") => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type: mime });
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const ligarCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch {
        alert("Camera ao vivo indisponivel. Use 'Enviar foto do aparelho'.");
      }
    }
  };

  const desligarCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const abrirModal = (id, tipo) => {
    const base = statusPostosRef.current[id] || { checkin: [], checkout: [] };
    if (tipo === "checkout" && base.checkin.length === 0) {
      alert("ERRO: Realize o Check-in antes do Check-Out.");
      return;
    }

    if (tipo === "checkout" && base.relatorio) {
      setDadosRelatorio({ ...base.relatorio });
    } else if (tipo === "checkout") {
      setDadosRelatorio({
        prevManha: "",
        prevTarde: "",
        vivaManha: "",
        vivaTarde: "",
      });
    }

    setModal({ aberto: true, tipo, postoId: id });
    setTimeout(ligarCamera, 200);
  };

  const adicionarFotoNoPosto = async (fotoFinal) => {
    const { postoId, tipo } = modal;

    const token = getToken();
    if (!token) {
      alert("Sessao expirada. Faca login novamente.");
      navigate("/login");
      return false;
    }

    const fotosAtuais = statusPostosRef.current[postoId]?.[tipo] || [];
    if (fotosAtuais.length >= 2) {
      alert("Limite de 2 fotos atingido para este registro.");
      return false;
    }

    try {
      const fotoFile = dataUrlToFile(fotoFinal, `${tipo}-posto-${postoId}.jpg`);
      if (tipo === "checkin") {
        await checkinRequest({ postoId, fotoFile, token });
      } else {
        await checkoutRequest({ postoId, fotoFile, token });
      }
      await carregarRegistros();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const baterFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      alert("Aguarde a camera iniciar e tente novamente.");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const fotoFinal = canvas.toDataURL("image/jpeg", 0.7);
    await adicionarFotoNoPosto(fotoFinal);
  };

  const selecionarFotoDoAparelho = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fotoFinal = await fileToDataUrl(file);
      await adicionarFotoNoPosto(fotoFinal);
    } catch (err) {
      alert("Erro ao processar foto: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const validarEFinalizar = async () => {
    const { postoId, tipo } = modal;
    const estadoAtual = statusPostosRef.current;
    const fotos = estadoAtual[postoId]?.[tipo] || [];
    const registroId = estadoAtual[postoId]?.registroId;

    if (fotos.length < 1) {
      alert("Voce precisa bater ao menos uma foto!");
      return;
    }

    if (tipo === "checkout") {
      const relatorioExistente = estadoAtual[postoId]?.relatorio;
      if (!relatorioExistente) {
        const { prevManha, prevTarde, vivaManha, vivaTarde } = dadosRelatorio;
        if (prevManha === "" || prevTarde === "" || vivaManha === "" || vivaTarde === "") {
          alert("Preencha todos os campos do relatorio!");
          return;
        }

        const token = getToken();
        if (!token) {
          alert("Sessao expirada. Faca login novamente.");
          navigate("/login");
          return;
        }

        try {
          const finalizado = await finalizarRegistroRequest(registroId, dadosRelatorio, token);
          historicoRef.current = [finalizado, ...historicoRef.current.filter((r) => r.id !== finalizado.id)];
          setHistorico(historicoRef.current);
          await carregarRegistros();
        } catch (err) {
          alert(err.message);
          return;
        }
      }
    }

    desligarCamera();
    setModal({ aberto: false, tipo: "", postoId: null });
  };

  const handleInput = (campo, valor) => {
    if (Number(valor) < 0) return;
    const postoAtual = statusPostosRef.current[modal.postoId];
    if (modal.tipo === "checkout" && postoAtual?.relatorio) return;
    setDadosRelatorio((old) => ({ ...old, [campo]: valor }));
  };

  const checkoutFinalizado =
    modal.tipo === "checkout" && !!statusPostos[modal.postoId]?.relatorio;

  const statusPostoUsuario = (dados) => {
    const temCheckin = (dados.checkin || []).length > 0;
    const checkoutFeito = !!dados.relatorio;
    if (temCheckin && checkoutFeito) return "completo";
    if (temCheckin || (dados.checkout || []).length > 0) return "andamento";
    return "vazio";
  };

  const estiloCardPosto = (status) => {
    if (status === "completo") {
      return {
        card: "border-green-500 bg-green-950/20",
        header: "bg-green-700",
        checkin: "bg-green-600/30 text-green-300",
        checkout: "bg-green-600/30 text-green-300",
      };
    }
    if (status === "andamento") {
      return {
        card: "border-yellow-500 bg-yellow-950/20",
        header: "bg-yellow-600 text-yellow-950",
        checkin: "bg-yellow-500/25 text-yellow-300",
        checkout: "bg-yellow-500/25 text-yellow-300",
      };
    }
    return {
      card: "border-gray-700",
      header: "bg-red-600",
      checkin: "text-gray-400",
      checkout: "text-gray-400",
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans pb-12">
      <canvas ref={canvasRef} className="hidden"></canvas>

      <header className="bg-red-700 p-4 shadow-2xl flex justify-between items-center border-b-4 border-red-900 sticky top-0 z-40">
        <h1 className="font-black italic uppercase tracking-tighter text-lg">Painel Operacional</h1>
        <button
          onClick={() => {
            clearAuth();
            navigate("/login");
          }}
          className="bg-black px-4 py-2 rounded-lg text-xs font-bold"
        >
          SAIR
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {isDemo() && (
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-900/40 border border-amber-600 rounded-xl py-2">
            Modo demonstração — dados de exemplo
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {postos.map((posto) => {
            const id = posto.id;
            const dados = dadosExibicaoPosto(id);
            const estilo = estiloCardPosto(statusPostoUsuario(dados));
            return (
              <div
                key={id}
                className={`bg-gray-800 rounded-2xl overflow-hidden border-2 shadow-lg ${estilo.card}`}
              >
                <div className={`p-4 text-center font-black italic text-2xl sm:text-3xl ${estilo.header}`}>
                  {posto.nome}
                </div>
                <div className="flex flex-col border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => abrirModal(id, "checkin")}
                    className={`p-4 font-bold text-sm border-b border-gray-700/50 ${estilo.checkin}`}
                  >
                    CHECK-IN {dados.checkin.length > 0 && `(${dados.checkin.length}/2)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModal(id, "checkout")}
                    className={`p-4 font-bold text-sm ${estilo.checkout}`}
                  >
                    CHECK-OUT {dados.checkout.length > 0 && `(${dados.checkout.length}/2)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gray-800 rounded-3xl p-8 border-t-8 border-blue-600 shadow-2xl">
          <h3 className="text-2xl font-black mb-8 uppercase text-blue-400 italic flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span> Historico de Registros (Fotos)
          </h3>
          <div className="space-y-8">
            {historico.length === 0 && (
              <p className="text-gray-500 text-sm italic">Nenhum check-out finalizado ainda.</p>
            )}
            {historico.map((registro) => {
              const info = mapRegistroToStatus(registro);
              const prevM = Number(info.relatorio?.prevManha ?? 0);
              const prevT = Number(info.relatorio?.prevTarde ?? 0);
              const vivaM = Number(info.relatorio?.vivaManha ?? 0);
              const vivaT = Number(info.relatorio?.vivaTarde ?? 0);

              return (
                <div
                  key={registro.id}
                  className="bg-gray-900 rounded-2xl p-6 border-l-8 border-green-600 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                    <h4 className="font-black text-xl text-white italic underline">
                      {nomePosto(registro.postoId)}
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      {registro.data} · {registro.hora}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                      <p className="text-xs font-black text-green-500 mb-4 tracking-widest uppercase">Entrada:</p>
                      <div className="flex gap-4">
                        {(info.checkin || []).map((f, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 bg-gray-800 border-2 border-green-500 rounded-xl flex items-center justify-center overflow-hidden">
                              <FotoApi
                                arquivoId={f.arquivoId}
                                className="w-full h-full object-cover"
                                alt="foto entrada"
                              />
                            </div>
                            <span className="text-[10px] text-white font-mono bg-gray-800 px-2 rounded">
                              {f.hora}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black text-red-500 mb-4 tracking-widest uppercase">Saida:</p>
                      <div className="flex gap-4">
                        {(info.checkout || []).map((f, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 bg-gray-800 border-2 border-red-500 rounded-xl flex items-center justify-center overflow-hidden">
                              <FotoApi
                                arquivoId={f.arquivoId}
                                className="w-full h-full object-cover"
                                alt="foto saida"
                              />
                            </div>
                            <span className="text-[10px] text-white font-mono bg-gray-800 px-2 rounded">
                              {f.hora}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {info.relatorio && (
                    <div className="mt-6 bg-black/50 rounded-xl p-4 border border-gray-700">
                      <p className="text-gray-500 font-black text-[10px] uppercase mb-3 tracking-widest text-center border-b border-gray-800 pb-2">
                        Prevenções da Missão
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Prevenções</p>
                          <div className="text-sm font-bold bg-gray-800 py-2 rounded-lg border border-gray-700 mb-1">
                            M: {info.relatorio.prevManha ?? 0} | T: {info.relatorio.prevTarde ?? 0}
                          </div>
                          <p className="text-[9px] text-gray-500 font-black uppercase">Total</p>
                          <div className="text-base font-black text-blue-400 bg-gray-800 py-2 rounded-lg border border-blue-900">
                            {prevM + prevT}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Água-Viva</p>
                          <div className="text-sm font-bold bg-gray-800 py-2 rounded-lg border border-gray-700 mb-1">
                            M: {info.relatorio.vivaManha ?? 0} | T: {info.relatorio.vivaTarde ?? 0}
                          </div>
                          <p className="text-[9px] text-gray-500 font-black uppercase">Total</p>
                          <div className="text-base font-black text-red-400 bg-gray-800 py-2 rounded-lg border border-red-900">
                            {vivaM + vivaT}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {modal.aberto && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 w-full max-w-md rounded-[2.5rem] overflow-hidden border border-gray-600 my-8 shadow-2xl">
            <div className="bg-red-700 p-6 text-center font-black uppercase text-xl">
              Posto {modal.postoId} - {modal.tipo}
            </div>

            <div className="p-8 text-center">
              <div className="w-full aspect-square bg-black rounded-3xl mb-8 flex items-center justify-center border-4 border-gray-700 relative overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                <span className="absolute top-4 text-red-500 animate-pulse text-xs font-mono font-bold bg-black/50 px-2">
                  ● AO VIVO
                </span>
              </div>

              <button
                onClick={baterFoto}
                className="w-24 h-24 bg-white rounded-full border-[10px] border-gray-400 active:scale-90 mb-4 shadow-xl"
              ></button>

              <div className="flex gap-2 justify-center mb-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-1 bg-gray-600 rounded-full ${
                      statusPostos[modal.postoId]?.[modal.tipo]?.[i] ? "bg-green-500" : ""
                    }`}
                  ></div>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={selecionarFotoDoAparelho}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-700 py-3 rounded-xl font-bold uppercase mb-8"
              >
                Enviar foto do aparelho
              </button>

              {modal.tipo === "checkout" && (
                <div className="mb-8 bg-gray-900 p-4 rounded-2xl">
                  {checkoutFinalizado && (
                    <p className="text-[10px] text-yellow-500 font-bold uppercase mb-3 tracking-widest">
                      Prevenções já enviadas — você pode alterar apenas as fotos
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Prev M"
                      value={dadosRelatorio.prevManha}
                      readOnly={checkoutFinalizado}
                      onChange={(e) => handleInput("prevManha", e.target.value)}
                      className={`bg-gray-800 p-2 rounded text-center text-sm border border-gray-700 ${
                        checkoutFinalizado ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    />
                    <input
                      type="number"
                      placeholder="Prev T"
                      value={dadosRelatorio.prevTarde}
                      readOnly={checkoutFinalizado}
                      onChange={(e) => handleInput("prevTarde", e.target.value)}
                      className={`bg-gray-800 p-2 rounded text-center text-sm border border-gray-700 ${
                        checkoutFinalizado ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    />
                    <input
                      type="number"
                      placeholder="Viva M"
                      value={dadosRelatorio.vivaManha}
                      readOnly={checkoutFinalizado}
                      onChange={(e) => handleInput("vivaManha", e.target.value)}
                      className={`bg-gray-800 p-2 rounded text-center text-sm border border-gray-700 ${
                        checkoutFinalizado ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    />
                    <input
                      type="number"
                      placeholder="Viva T"
                      value={dadosRelatorio.vivaTarde}
                      readOnly={checkoutFinalizado}
                      onChange={(e) => handleInput("vivaTarde", e.target.value)}
                      className={`bg-gray-800 p-2 rounded text-center text-sm border border-gray-700 ${
                        checkoutFinalizado ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={validarEFinalizar}
                className="w-full bg-blue-600 py-5 rounded-[2rem] font-black uppercase tracking-widest active:scale-95"
              >
                Confirmar Registro
              </button>

              <button
                onClick={() => {
                  desligarCamera();
                  setModal({ aberto: false, tipo: "", postoId: null });
                }}
                className="mt-4 text-gray-500 text-xs font-bold uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;