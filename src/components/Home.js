import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-700 via-blue-800 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center border-t-8 border-red-600">
        <img 
          src="https://www.cbm.sc.gov.br/images/logo_marcas/Logo.png" 
          alt="Logo Bombeiros" 
          className="w-40 mx-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-3xl font-black text-gray-800 mb-2">SISTEMA GUARDA-VIDA</h1>
        <p className="text-gray-500 mb-8 font-medium">Corpo de Bombeiros Militar</p>

        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95"
        >
          ACESSAR SISTEMA
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/login?perfil=usuario')}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-3 rounded-xl text-sm active:scale-95"
          >
            Login usuário
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?perfil=admin')}
            className="bg-white text-slate-800 border-2 border-slate-800 hover:bg-slate-50 font-bold py-3 px-3 rounded-xl text-sm active:scale-95"
          >
            Login admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
