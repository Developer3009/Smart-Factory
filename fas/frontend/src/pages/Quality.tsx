import { useEffect, useState } from 'react';
import { getDefectsSummary } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Quality() {
  const [summary, setSummary] = useState<{by_type: any[], by_machine: any[]}>({by_type: [], by_machine: []});

  useEffect(() => {
    const fetchData = async () => {
      setSummary(await getDefectsSummary());
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quality Control</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4">Defects by Type</h2>
          <div className="h-64">
            {summary.by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="defect_type" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 h-full flex items-center justify-center">No defects logged yet.</div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4">Defects by Machine</h2>
          <div className="h-64">
            {summary.by_machine.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.by_machine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="machine_name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 h-full flex items-center justify-center">No defects logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
