import { Link } from 'react-router-dom';

export function Menu() {
  return (
    <nav className="bg-slate-800 p-4 flex justify-center gap-8 border-b border-white/10">
      <Link to="/" className="text-white font-black uppercase text-xs tracking-widest hover:text-red-500 transition-colors">
        🏠 Início
      </Link>
    </nav>
  );
}