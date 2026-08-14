import { type ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Factory, TrendingUp, ShieldAlert, Package, Bot, Users, History, LogOut } from 'lucide-react';
import Overview from './pages/Overview.tsx';
import Machines from './pages/Machines.tsx';
import Production from './pages/Production.tsx';
import Quality from './pages/Quality.tsx';
import Inventory from './pages/Inventory.tsx';
import AIAssistant from './pages/AIAssistant.tsx';
import FaceAuth from './pages/FaceAuth.tsx';
import Employees from './pages/Employees.tsx';
import LoginHistory from './pages/LoginHistory.tsx';
import { setAuthToken } from './api';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles = ['operator', 'manager', 'admin'] }: { children: ReactNode; allowedRoles?: string[] }) {
  const user = getCurrentUser();
  const token = localStorage.getItem('jwt');
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/face-auth" replace state={{ from: location }} />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  const token = localStorage.getItem('jwt');
  const location = useLocation();

  if (token && user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function Sidebar() {
  const user = getCurrentUser();
  const role = user?.role || 'operator';

  const items = [
    { path: '/', label: 'Overview', icon: LayoutDashboard, allowed: ['operator', 'manager', 'admin'] },
    { path: '/machines', label: 'Machines', icon: Factory, allowed: ['operator', 'manager', 'admin'] },
    { path: '/production', label: 'Production', icon: TrendingUp, allowed: ['manager', 'admin'] },
    { path: '/quality', label: 'Quality', icon: ShieldAlert, allowed: ['manager', 'admin'] },
    { path: '/inventory', label: 'Inventory', icon: Package, allowed: ['operator', 'manager', 'admin'] },
    { path: '/employees', label: 'Employees', icon: Users, allowed: ['manager', 'admin'] },
    { path: '/login-history', label: 'Login History', icon: History, allowed: ['manager', 'admin'] },
    { path: '/ai', label: 'AI Agent', icon: Bot, allowed: ['admin'] },
  ];

  const onLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setAuthToken();
    window.location.href = '/face-auth';
  };

  return (
    <div className="w-64 bg-surface h-screen border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Factory size={24} />
          FAS
        </h1>
        <p className="text-xs text-slate-400 mt-1">Factory Automation System</p>
        <div className="mt-3 text-xs text-slate-300">Signed in as <span className="font-semibold text-primary">{user?.name || 'Guest'}</span></div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400">Role: {role}</div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {items.filter(item => item.allowed.includes(role)).map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Icon size={20} /> {label}
          </Link>
        ))}
        <button onClick={onLogout} className="mt-4 flex w-full items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </nav>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('jwt');
  const user = getCurrentUser();

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt');
    if (storedToken) {
      setAuthToken(storedToken);
    } else {
      setAuthToken();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/face-auth" element={<PublicRoute><FaceAuth /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Overview /></main></div></ProtectedRoute>} />
        <Route path="/overview" element={<ProtectedRoute><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Overview /></main></div></ProtectedRoute>} />
        <Route path="/machines" element={<ProtectedRoute allowedRoles={['operator','manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Machines /></main></div></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute allowedRoles={['manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Production /></main></div></ProtectedRoute>} />
        <Route path="/quality" element={<ProtectedRoute allowedRoles={['manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Quality /></main></div></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={['operator','manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Inventory /></main></div></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute allowedRoles={['admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><AIAssistant /></main></div></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute allowedRoles={['manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><Employees /></main></div></ProtectedRoute>} />
        <Route path="/login-history" element={<ProtectedRoute allowedRoles={['manager','admin']}><div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-background p-8"><LoginHistory /></main></div></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token && user ? '/' : '/face-auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
