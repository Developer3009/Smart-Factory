import { useEffect, useState } from 'react';
import { getOEE, getMachines, getAlerts, toggleSimulator, getSimulatorStatus } from '../api';
import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Overview() {
  const [oee, setOee] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [simStatus, setSimStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setOee(await getOEE());
        setMachines(await getMachines());
        setAlerts(await getAlerts());
        setSimStatus(await getSimulatorStatus());
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Factory Overview</h1>
        <div className="flex items-center gap-4 bg-surface p-3 rounded-xl border border-slate-700">
          <span className="text-sm text-slate-300">Simulator:</span>
          <div className="flex gap-2">
            <button 
              onClick={() => toggleSimulator(true)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${simStatus?.is_running ? 'bg-success/20 text-success' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              Start
            </button>
            <button 
              onClick={() => toggleSimulator(false)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${!simStatus?.is_running ? 'bg-danger/20 text-danger' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 mb-4">
            <span>Overall OEE</span>
            <Activity size={20} />
          </div>
          <div className="text-4xl font-bold text-primary">{oee?.overall ?? '--'}%</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 mb-4">
            <span>Availability</span>
          </div>
          <div className="text-3xl font-bold">{oee?.availability ?? '--'}%</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 mb-4">
            <span>Performance</span>
          </div>
          <div className="text-3xl font-bold">{oee?.performance ?? '--'}%</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 mb-4">
            <span>Quality</span>
          </div>
          <div className="text-3xl font-bold">{oee?.quality ?? '--'}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Machine Status */}
        <div className="col-span-2 bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4">Live Machine Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {machines.map(m => (
              <div key={m.machine_id} className="p-4 rounded-lg bg-slate-800/50 flex items-center justify-between">
                <div>
                  <div className="font-bold">{m.name}</div>
                  <div className="text-sm text-slate-400">{m.type} • {m.location}</div>
                </div>
                <div>
                  {m.status === 'running' && <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded text-sm"><CheckCircle2 size={16}/> Running</span>}
                  {m.status === 'idle' && <span className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded text-sm"><Activity size={16}/> Idle</span>}
                  {m.status === 'down' && <span className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-1 rounded text-sm"><XCircle size={16}/> Down</span>}
                </div>
              </div>
            ))}
            {machines.length === 0 && <div className="text-slate-400">No machines found. Check database connection.</div>}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-warning" /> Active Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-slate-400 text-sm">No active alerts.</div>
            ) : (
              alerts.map(a => (
                <div key={a.alert_id} className="p-3 rounded bg-slate-800 border-l-4 border-warning">
                  <div className="text-sm">{a.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
