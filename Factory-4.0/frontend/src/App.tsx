import { type ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Factory, TrendingUp, ShieldAlert, Package, Bot, Users, History, LogOut, Bell, Search, ChevronDown, Gauge, Activity } from 'lucide-react';
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
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Factory size={20} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-wide text-white">FAS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Spare Parts Plant</div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Operator</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-white">{user?.name || 'Guest'}</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">{role}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2 text-slate-300 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-primary" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Plant Mode</span>
          </div>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success">Live</span>
        </div>

        <nav className="space-y-1.5">
          {items.filter(item => item.allowed.includes(role)).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button onClick={onLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <Activity size={12} className="text-warning" />
            Line Health
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-white">96.4%</div>
              <div className="text-xs text-slate-400">Uptime</div>
            </div>
            <div className="rounded-full bg-success/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-success">Stable</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-background dark:text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900">
                <Search size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search machines, components, alerts..."
                className="w-80 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Bell size={16} />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-white dark:ring-slate-950" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 font-semibold text-slate-950">AS</div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">A. Sharma</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Plant Lead</div>
                </div>
                <ChevronDown size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-100 p-6 dark:bg-background">{children}</main>
      </div>
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
        <Route path="/" element={<ProtectedRoute><Shell><Overview /></Shell></ProtectedRoute>} />
        <Route path="/overview" element={<ProtectedRoute><Shell><Overview /></Shell></ProtectedRoute>} />
        <Route path="/machines" element={<ProtectedRoute allowedRoles={['operator','manager','admin']}><Shell><Machines /></Shell></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute allowedRoles={['manager','admin']}><Shell><Production /></Shell></ProtectedRoute>} />
        <Route path="/quality" element={<ProtectedRoute allowedRoles={['manager','admin']}><Shell><Quality /></Shell></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={['operator','manager','admin']}><Shell><Inventory /></Shell></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute allowedRoles={['admin']}><Shell><AIAssistant /></Shell></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute allowedRoles={['manager','admin']}><Shell><Employees /></Shell></ProtectedRoute>} />
        <Route path="/login-history" element={<ProtectedRoute allowedRoles={['manager','admin']}><Shell><LoginHistory /></Shell></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token && user ? '/' : '/face-auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
