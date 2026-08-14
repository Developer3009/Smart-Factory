import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Factory, TrendingUp, ShieldAlert, Package, Bot } from 'lucide-react';
import Overview from './pages/Overview.tsx';
import Machines from './pages/Machines.tsx';
import Production from './pages/Production.tsx';
import Quality from './pages/Quality.tsx';
import Inventory from './pages/Inventory.tsx';
import AIAssistant from './pages/AIAssistant.tsx';
import FaceAuth from './pages/FaceAuth.tsx';

function Sidebar() {
  return (
    <div className="w-64 bg-surface h-screen border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Factory size={24} />
          FAS
        </h1>
        <p className="text-xs text-slate-400 mt-1">Factory Automation System</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <LayoutDashboard size={20} /> Overview
        </Link>
        <Link to="/machines" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <Factory size={20} /> Machines
        </Link>
        <Link to="/production" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <TrendingUp size={20} /> Production
        </Link>
        <Link to="/quality" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <ShieldAlert size={20} /> Quality
        </Link>
        <Link to="/inventory" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <Package size={20} /> Inventory
        </Link>
        <Link to="/ai" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <Bot size={20} /> AI Agent
        </Link>
        <Link to="/face-auth" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <Factory size={20} /> Face Login
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/production" element={<Production />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/face-auth" element={<FaceAuth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
