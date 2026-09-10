import React from 'react';

const Publico = () => {
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white text-center py-16 px-4">
        <h1 className="text-4xl font-black mb-4 uppercase">Portal de Segurança Balnear</h1>
        <p className="text-blue-100 max-w-2xl mx-auto">Confira as condições do mar e as orientações do Corpo de Bombeiros antes de entrar na água.</p>
      </div>

      <div className="max-w-4xl mx-auto -mt-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status da Bandeira */}
          <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
            <div className="w-24 h-24 bg-green-500 rounded-full mb-4 border-8 border-green-100 animate-pulse"></div>
            <h2 className="text-2xl font-bold text-gray-800">Bandeira Verde</h2>
            <p className="text-gray-500 text-center mt-2">Condições favoráveis para o banho. Mantenha a atenção.</p>
          </div>

          {/* Dicas de Segurança */}
          <div className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Dicas de Prevenção</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2">🚩 Nade próximo a um posto ativo</li>
              <li className="flex items-center gap-2">🧒 Crianças sempre com pulseira de identificação</li>
              <li className="flex items-center gap-2">⚠️ Água no umbigo, sinal de perigo</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          Informações atualizadas em tempo real pelo CBM.
        </div>
      </div>
    </div>
  );
};

export default Publico;